import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from '../appointment.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * También cumple el rol de `SendRsvpRequestJob` (diseño sección 4: "por defecto se envía junto
 * al recordatorio 24h", evitando un job adicional).
 */
@Injectable()
export class SendReminder24hJob {
  private readonly logger = new Logger(SendReminder24hJob.name);

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 */15 * * * *')
  async handle() {
    const appointments = await this.appointmentService.findAppointmentsForReminder(24);
    for (const appointment of appointments) {
      await this.notificationsService.notify({
        to: appointment.buyer_id,
        templateKey: 'reminder_24h',
        variables: { scheduledAt: appointment.scheduled_at.toISOString() },
      });
      await this.notificationsService.notify({
        to: appointment.buyer_id,
        templateKey: 'rsvp_request',
        variables: { scheduledAt: appointment.scheduled_at.toISOString() },
      });
    }
    if (appointments.length) {
      this.logger.log(`Recordatorios 24h enviados: ${appointments.length}`);
    }
  }
}
