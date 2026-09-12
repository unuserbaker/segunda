import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentService } from '../appointment.service';

@Injectable()
export class ExpireCustomerResultWindowJob {
  private readonly logger = new Logger(ExpireCustomerResultWindowJob.name);

  constructor(private readonly appointmentService: AppointmentService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handle() {
    const ids = await this.appointmentService.findExpiredCustomerResultTokenIds();
    for (const id of ids) {
      await this.appointmentService.expireCustomerResultWindow(id);
    }
    if (ids.length) {
      this.logger.log(`Ventanas de resultado del customer expiradas: ${ids.length}`);
    }
  }
}
