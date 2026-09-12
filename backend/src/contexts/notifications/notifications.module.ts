import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailChannel } from './email.channel';
import { NOTIFICATION_CHANNELS } from './notification-channel.interface';

@Module({
  providers: [
    EmailChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (emailChannel: EmailChannel) => [emailChannel],
      inject: [EmailChannel],
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
