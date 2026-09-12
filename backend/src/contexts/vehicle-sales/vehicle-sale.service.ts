import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Status } from '../vehicles/entities/status.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { VehicleService } from '../vehicles/vehicle.service';
import { AppointmentService } from '../scheduling/appointment.service';
import { BusinessEventsService } from '../scheduling/business-events.service';

@Injectable()
export class VehicleSaleService {
  private readonly logger = new Logger(VehicleSaleService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly vehicleService: VehicleService,
    private readonly appointmentService: AppointmentService,
    private readonly businessEvents: BusinessEventsService,
  ) {}

  /**
   * Orquesta la venta de un vehículo (HU-VTA-01/02): dentro de una única transacción real
   * (mismo `DataSource`/Postgres, mismo patrón que `AppointmentService.createAppointment`),
   * cancela la cita `agendada` activa (si existe) y marca el vehículo como `sold`. Todo o nada.
   * Notificaciones y `businessEvents` corren después del commit (best-effort).
   */
  async markAsSold(
    vehicleId: string,
    userId: string,
    internalRole?: string | null,
  ): Promise<{ record: Vehicle; cancelledAppointment: boolean }> {
    await this.vehicleService.assertOwnerOrAdmin(vehicleId, userId, internalRole);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let cancelledAppointment: Appointment | null = null;

    try {
      const vehicleRepo = queryRunner.manager.getRepository(Vehicle);
      const statusRepo = queryRunner.manager.getRepository(Status);
      const appointmentRepo = queryRunner.manager.getRepository(Appointment);

      const vehicle = await vehicleRepo.findOne({ where: { id: vehicleId }, relations: ['status'] });
      if (!vehicle) {
        throw new NotFoundException('Vehículo no encontrado');
      }
      if (vehicle.status?.str_code === 'sold') {
        throw new ConflictException('El vehículo ya está marcado como vendido');
      }

      const soldStatus = await statusRepo.findOneBy({ str_code: 'sold' });
      if (!soldStatus) {
        throw new NotFoundException('Catálogo "sold" no encontrado (seed pendiente)');
      }

      const activeAppointment = await appointmentRepo.findOneBy({
        vehicle_id: vehicleId,
        status: 'agendada',
      });
      if (activeAppointment) {
        await appointmentRepo.update(activeAppointment.id, { status: 'cancelada_por_venta' });
        cancelledAppointment = activeAppointment;
      }

      await vehicleRepo.update(vehicleId, { status_id: soldStatus.id });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Side effects best-effort, después del commit (no bloquean la respuesta ni pueden revertir
    // la transacción ya confirmada).
    try {
      await this.businessEvents.record('vehicle_archived', 'vehicle', vehicleId, {});
      if (cancelledAppointment) {
        await this.appointmentService.notifyCancelledBySale(cancelledAppointment);
      }
    } catch (err) {
      this.logger.error(
        `Fallo en side effects post-venta del vehículo ${vehicleId}: ${(err as Error).message}`,
      );
    }

    const record = await this.vehicleService.findOne(vehicleId);
    return { record: record as unknown as Vehicle, cancelledAppointment: !!cancelledAppointment };
  }
}
