import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentRating } from './entities/appointment-rating.entity';
import { SchedulingSetting } from './entities/scheduling-setting.entity';
import { BusinessEvent } from './entities/business-event.entity';
import { DisputeNote } from './entities/dispute-note.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { SettingsService } from './settings.service';
import { BusinessEventsService } from './business-events.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { SellersModule } from '../sellers/sellers.module';
import { IamModule } from '../iam/iam.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReleaseExpiredSlotsJob } from './jobs/release-expired-slots.job';
import { SendReminder24hJob } from './jobs/send-reminder-24h.job';
import { SendReminder2hJob } from './jobs/send-reminder-2h.job';
import { SendCloseOfCycleLinkJob } from './jobs/send-close-of-cycle-link.job';
import { ExpireCustomerResultWindowJob } from './jobs/expire-customer-result-window.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentRating,
      SchedulingSetting,
      BusinessEvent,
      DisputeNote,
    ]),
    VehiclesModule,
    SellersModule,
    IamModule,
    NotificationsModule,
  ],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    SettingsService,
    BusinessEventsService,
    ReleaseExpiredSlotsJob,
    SendReminder24hJob,
    SendReminder2hJob,
    SendCloseOfCycleLinkJob,
    ExpireCustomerResultWindowJob,
  ],
  exports: [AppointmentService, SettingsService, BusinessEventsService],
})
export class SchedulingModule {}
