import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from '../appointment.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class SendCloseOfCycleLinkJob {
  private readonly logger = new Logger(SendCloseOfCycleLinkJob.name);

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 */15 * * * *')
  async handle() {
    const appointments = await this.appointmentService.findAppointmentsPendingCloseOfCycleLink();
    for (const appointment of appointments) {
      const rawToken = await this.appointmentService.generateCustomerResultToken(appointment.id);
      await this.notificationsService.notify({
        to: appointment.buyer_id,
        templateKey: 'appointment_closed_link',
        variables: { link: `/appointments/customer-result/${rawToken}` },
      });
    }
    if (appointments.length) {
      this.logger.log(`Links de cierre de ciclo enviados: ${appointments.length}`);
    }
  }
}
