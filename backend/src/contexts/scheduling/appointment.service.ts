import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, IsNull, Not, Between } from 'typeorm';
import * as crypto from 'crypto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentRating } from './entities/appointment-rating.entity';
import { DisputeNote } from './entities/dispute-note.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Status } from '../vehicles/entities/status.entity';
import { VehicleService } from '../vehicles/vehicle.service';
import { IamService } from '../iam/iam.service';
import { SettingsService } from './settings.service';
import { BusinessEventsService } from './business-events.service';
import { NotificationsService } from '../notifications/notifications.service';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentRating)
    private readonly ratingRepo: Repository<AppointmentRating>,
    @InjectRepository(DisputeNote)
    private readonly disputeNoteRepo: Repository<DisputeNote>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly vehicleService: VehicleService,
    private readonly iamService: IamService,
    private readonly settingsService: SettingsService,
    private readonly businessEvents: BusinessEventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page = 1, size = 10, filters: { isDisputed?: boolean } = {}) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const where: Record<string, unknown> = {};
    if (filters.isDisputed !== undefined) {
      where.is_disputed = filters.isDisputed;
    }

    const [rows, totalItems] = await this.appointmentRepo.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / limit);
    return { currentPage: page, limit, totalPages, totalItems, rows };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
    return appointment;
  }

  private async existsActiveAppointmentForBuyer(buyerId: string): Promise<boolean> {
    const count = await this.appointmentRepo.count({
      where: { buyer_id: buyerId, status: 'agendada' },
    });
    return count > 0;
  }

  /**
   * Crea la cita y bloquea el vehículo de forma atómica (misma transacción cross-schema),
   * siguiendo el trade-off explícito del arquitecto (sección 7): usa `queryRunner` para escribir
   * tanto `Appointment` como `Vehicle.status_id` en la misma transacción, sin invocar lógica de
   * negocio de `VehiclesService` dentro de la transacción (solo el dato mínimo necesario para el
   * FK/estado), evitando así una transacción distribuida cross-service innecesaria.
   */
  async createAppointment(buyerId: string, vehicleId: string, scheduledAtIso: string) {
    const emailVerified = await this.iamService.isEmailVerified(buyerId);
    if (!emailVerified) {
      throw new ForbiddenException('Debes verificar tu email antes de agendar una cita');
    }

    if (await this.existsActiveAppointmentForBuyer(buyerId)) {
      throw new ConflictException('Ya tienes una cita activa agendada');
    }

    const vehicleSummary = await this.vehicleService.getSchedulingSummary(vehicleId);
    if (!vehicleSummary) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    if (vehicleSummary.isBlocked) {
      throw new ConflictException('El vehículo ya tiene una cita activa');
    }

    const scheduledAt = new Date(scheduledAtIso);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt debe ser una fecha futura válida');
    }

    const releaseWindowHours = await this.settingsService.get('rsvp_release_window_hours', 4);
    const releaseAt = new Date(scheduledAt.getTime() - releaseWindowHours * 60 * 60 * 1000);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let appointment: Appointment;
    try {
      const apptRepo = queryRunner.manager.getRepository(Appointment);
      appointment = apptRepo.create({
        vehicle_id: vehicleId,
        seller_id: vehicleSummary.sellerId,
        buyer_id: buyerId,
        scheduled_at: scheduledAt,
        status: 'agendada',
        release_at: releaseAt,
      });
      appointment = await apptRepo.save(appointment);

      const statusRepo = queryRunner.manager.getRepository(Status);
      const activeStatus = await statusRepo.findOneBy({ str_code: 'active_appointment' });
      if (!activeStatus) {
        throw new NotFoundException('Catálogo "active_appointment" no encontrado (seed pendiente)');
      }
      await queryRunner.manager.getRepository(Vehicle).update(vehicleId, {
        status_id: activeStatus.id,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    await this.businessEvents.record('visit_scheduled', 'appointment', appointment.id, {
      vehicleId,
      buyerId,
      sellerId: vehicleSummary.sellerId,
    });

    await this.notificationsService.notify({
      to: buyerId,
      templateKey: 'appointment_confirmed',
      variables: { vehicleId, scheduledAt: scheduledAt.toISOString() },
    });

    return appointment;
  }

  async confirmRsvp(appointmentId: string, buyerId: string): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);
    if (appointment.buyer_id !== buyerId) {
      throw new ForbiddenException('No puedes confirmar una cita que no es tuya');
    }
    if (appointment.status !== 'agendada') {
      throw new ConflictException('Solo se puede confirmar una cita en estado "agendada"');
    }
    if (new Date() >= appointment.release_at) {
      throw new ConflictException('La ventana de confirmación ya expiró');
    }

    await this.appointmentRepo.update(appointmentId, { rsvp_confirmed_at: new Date() });
    return this.findOne(appointmentId);
  }

  /** Invocado por `ReleaseExpiredSlotsJob`, no por el usuario. */
  async releaseExpiredSlot(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepo.findOneBy({ id: appointmentId });
    if (!appointment) return;
    if (appointment.status !== 'agendada' || appointment.rsvp_confirmed_at) return;
    if (new Date() < appointment.release_at) return;

    await this.appointmentRepo.update(appointmentId, { status: 'liberada' });
    await this.vehicleService.releaseFromAppointment(appointment.vehicle_id);
    await this.businessEvents.record('vehicle_reactivated', 'appointment', appointmentId, {
      vehicleId: appointment.vehicle_id,
    });
  }

  async findActiveAppointmentIdsForRelease(): Promise<string[]> {
    const rows = await this.appointmentRepo.find({
      where: { status: 'agendada', rsvp_confirmed_at: IsNull(), release_at: LessThanOrEqual(new Date()) },
      select: ['id'],
    });
    return rows.map((r) => r.id);
  }

  /**
   * Ventana de recordatorio: citas `agendada` cuyo `scheduled_at` cae entre
   * `[now + hoursAhead - toleranceMinutes, now + hoursAhead]`. Usado por `SendReminder24hJob`
   * (incluye el pedido de RSVP, ver diseño sección 4) y `SendReminder2hJob`.
   */
  async findAppointmentsForReminder(hoursAhead: number, toleranceMinutes = 15): Promise<Appointment[]> {
    const now = Date.now();
    const windowEnd = new Date(now + hoursAhead * 60 * 60 * 1000);
    const windowStart = new Date(windowEnd.getTime() - toleranceMinutes * 60 * 1000);

    return this.appointmentRepo.find({
      where: { status: 'agendada', scheduled_at: Between(windowStart, windowEnd) },
    });
  }

  /**
   * Lectura simple de la cita `agendada` activa para un vehículo, reutilizable tanto fuera de
   * una transacción (wrapper `cancelBySale`) como dentro de una transacción externa orquestada
   * por otro contexto (ver `VehicleSaleService.markAsSold`, que hace el propio `UPDATE` con el
   * repo del `queryRunner` en vez de usar `this.appointmentRepo`).
   */
  async findActiveAppointmentByVehicle(vehicleId: string): Promise<Appointment | null> {
    return this.appointmentRepo.findOneBy({
      vehicle_id: vehicleId,
      status: 'agendada',
    });
  }

  /**
   * Side effects post-cancelación (best-effort, pensados para ejecutarse **después** del commit
   * de la transacción que cambió el status de la cita): sugiere alternativas al buyer, notifica y
   * registra el evento de negocio `appointment_cancelled_by_sale`.
   */
  async notifyCancelledBySale(appointment: Appointment): Promise<void> {
    const n = await this.settingsService.get('n_alternative_vehicles', 3);
    const alternatives = await this.vehicleService.suggestAlternatives(
      appointment.seller_id,
      appointment.vehicle_id,
      n,
    );

    await this.notificationsService.notify({
      to: appointment.buyer_id,
      templateKey: 'sale_cancelled_alternatives',
      variables: { vehicleId: appointment.vehicle_id, alternatives: alternatives.map((v) => v.id) },
    });

    await this.businessEvents.record(
      'appointment_cancelled_by_sale',
      'appointment',
      appointment.id,
      { vehicleId: appointment.vehicle_id },
    );
  }

  /**
   * Invocado por `vehicles` cuando el seller marca el vehículo vendido. Método de conveniencia
   * (no transaccional) para llamadores que no necesitan atomicidad cross-schema. El flujo
   * transaccional real (`PATCH /vehicles/:id/sell`) usa `findActiveAppointmentByVehicle` +
   * `notifyCancelledBySale` por separado, con el `UPDATE` de la cita ejecutado dentro de la misma
   * transacción que archiva el vehículo.
   */
  async cancelBySale(vehicleId: string): Promise<void> {
    const appointment = await this.findActiveAppointmentByVehicle(vehicleId);
    if (!appointment) return;

    await this.appointmentRepo.update(appointment.id, { status: 'cancelada_por_venta' });
    await this.notifyCancelledBySale(appointment);
  }

  async recordSellerResult(
    appointmentId: string,
    sellerId: string,
    result: 'atendido' | 'no_se_presento',
  ): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);
    if (appointment.seller_id !== sellerId) {
      throw new ForbiddenException('No puedes registrar el resultado de una cita que no es tuya');
    }
    if (appointment.status !== 'agendada') {
      throw new ConflictException('Solo se puede registrar el resultado de una cita "agendada"');
    }
    if (new Date() < appointment.scheduled_at) {
      throw new ConflictException('La cita todavía no ha ocurrido');
    }

    await this.appointmentRepo.update(appointmentId, {
      seller_result: result,
      seller_result_at: new Date(),
    });

    if (result === 'no_se_presento') {
      await this.vehicleService.releaseFromAppointment(appointment.vehicle_id);
    }

    await this.businessEvents.record('visit_result_recorded', 'appointment', appointmentId, {
      result,
      source: 'seller',
    });

    const refreshed = await this.findOne(appointmentId);
    return this.resolveFinalState(refreshed);
  }

  /** Genera el token de cierre de ciclo. Invocado por `SendCloseOfCycleLinkJob`. */
  async generateCustomerResultToken(appointmentId: string): Promise<string> {
    const windowHours = await this.settingsService.get('customer_link_window_hours', 72);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + windowHours * 60 * 60 * 1000);

    await this.appointmentRepo.update(appointmentId, {
      customer_result_token: hashToken(rawToken),
      customer_result_token_expires_at: expiresAt,
    });

    return rawToken;
  }

  async findAppointmentsPendingCloseOfCycleLink(): Promise<Appointment[]> {
    return this.appointmentRepo.find({
      where: { seller_result: Not(IsNull()), customer_result_token: IsNull() },
    });
  }

  async getByCustomerResultToken(token: string): Promise<Appointment> {
    const hashed = hashToken(token);
    const appointment = await this.appointmentRepo.findOneBy({ customer_result_token: hashed });
    if (!appointment) {
      throw new NotFoundException('Token inválido');
    }
    return appointment;
  }

  /** Público, sin login. Valida token + ventana 72h. */
  async recordCustomerResult(token: string, result: 'asisti' | 'no_pude_ir'): Promise<Appointment> {
    const hashed = hashToken(token);
    const appointment = await this.appointmentRepo.findOneBy({ customer_result_token: hashed });
    if (!appointment) {
      throw new NotFoundException('Token inválido');
    }
    if (appointment.customer_result) {
      throw new ConflictException('Ya se registró el resultado del customer para esta cita');
    }
    if (
      !appointment.customer_result_token_expires_at ||
      appointment.customer_result_token_expires_at < new Date()
    ) {
      throw new BadRequestException('El link ya expiró');
    }

    await this.appointmentRepo.update(appointment.id, {
      customer_result: result,
      customer_result_at: new Date(),
    });

    const refreshed = await this.findOne(appointment.id);
    return this.resolveFinalState(refreshed);
  }

  /** Invocado por `ExpireCustomerResultWindowJob`. No cambia `status`, solo invalida el token. */
  async expireCustomerResultWindow(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepo.findOneBy({ id: appointmentId });
    if (!appointment) return;
    if (!appointment.customer_result_token || appointment.customer_result) return;
    if (
      !appointment.customer_result_token_expires_at ||
      appointment.customer_result_token_expires_at > new Date()
    ) {
      return;
    }
    await this.appointmentRepo.update(appointmentId, { customer_result_token: null });
  }

  async findExpiredCustomerResultTokenIds(): Promise<string[]> {
    const rows = await this.appointmentRepo.find({
      where: {
        customer_result_token: Not(IsNull()),
        customer_result: IsNull(),
        customer_result_token_expires_at: LessThanOrEqual(new Date()),
      },
      select: ['id'],
    });
    return rows.map((r) => r.id);
  }

  /**
   * Regla determinística de discrepancia (sección 2.4). Persiste `status`/`is_disputed` en base al
   * `seller_result` (fuente autoritativa).
   */
  async resolveFinalState(appointment: Appointment): Promise<Appointment> {
    if (!appointment.seller_result) {
      return appointment;
    }

    let isDisputed = false;
    if (appointment.customer_result) {
      const matches =
        (appointment.seller_result === 'atendido' && appointment.customer_result === 'asisti') ||
        (appointment.seller_result === 'no_se_presento' &&
          appointment.customer_result === 'no_pude_ir');
      isDisputed = !matches;
    }

    await this.appointmentRepo.update(appointment.id, {
      status: appointment.seller_result,
      is_disputed: isDisputed,
    });

    return this.findOne(appointment.id);
  }

  async submitRating(
    appointmentId: string,
    userId: string,
    raterRole: 'seller' | 'buyer',
    stars: number,
    label: string,
  ): Promise<AppointmentRating> {
    if (stars < 1 || stars > 5) {
      throw new BadRequestException('stars debe estar entre 1 y 5');
    }

    const appointment = await this.findOne(appointmentId);

    if (!appointment.seller_result) {
      throw new ConflictException('La cita aún no tiene un resultado registrado');
    }

    if (raterRole === 'seller' && appointment.seller_id !== userId) {
      throw new ForbiddenException('No puedes calificar una cita que no es tuya');
    }
    if (raterRole === 'buyer' && appointment.buyer_id !== userId) {
      throw new ForbiddenException('No puedes calificar una cita que no es tuya');
    }

    const existing = await this.ratingRepo.findOneBy({
      appointment_id: appointmentId,
      rater_role: raterRole,
    });
    if (existing) {
      throw new ConflictException('Ya calificaste esta cita');
    }

    const rating = this.ratingRepo.create({
      appointment_id: appointmentId,
      rater_role: raterRole,
      stars,
      label,
    });
    const saved = await this.ratingRepo.save(rating);

    await this.businessEvents.record('rating_submitted', 'appointment', appointmentId, {
      raterRole,
      stars,
    });

    return saved;
  }

  async addDisputeNote(appointmentId: string, authorId: string, note: string): Promise<DisputeNote> {
    await this.findOne(appointmentId); // valida existencia
    const disputeNote = this.disputeNoteRepo.create({
      appointment_id: appointmentId,
      author_id: authorId,
      note,
    });
    return this.disputeNoteRepo.save(disputeNote);
  }

  async listDisputeNotes(appointmentId: string): Promise<DisputeNote[]> {
    return this.disputeNoteRepo.find({
      where: { appointment_id: appointmentId },
      order: { created_at: 'ASC' },
    });
  }
}
