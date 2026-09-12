import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from '../appointment.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class SendReminder2hJob {
  private readonly logger = new Logger(SendReminder2hJob.name);

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handle() {
    const appointments = await this.appointmentService.findAppointmentsForReminder(2, 5);
    for (const appointment of appointments) {
      await this.notificationsService.notify({
        to: appointment.buyer_id,
        templateKey: 'reminder_2h',
        variables: { scheduledAt: appointment.scheduled_at.toISOString() },
      });
    }
    if (appointments.length) {
      this.logger.log(`Recordatorios 2h enviados: ${appointments.length}`);
    }
  }
}
