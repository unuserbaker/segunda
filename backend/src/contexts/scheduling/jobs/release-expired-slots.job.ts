import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from '../appointment.service';

@Injectable()
export class ReleaseExpiredSlotsJob {
  private readonly logger = new Logger(ReleaseExpiredSlotsJob.name);

  constructor(private readonly appointmentService: AppointmentService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handle() {
    const ids = await this.appointmentService.findActiveAppointmentIdsForRelease();
    for (const id of ids) {
      await this.appointmentService.releaseExpiredSlot(id);
    }
    if (ids.length) {
      this.logger.log(`Liberados ${ids.length} slots expirados`);
    }
  }
}
