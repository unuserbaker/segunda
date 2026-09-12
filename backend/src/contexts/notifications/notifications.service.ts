import { Injectable, Inject, Logger } from '@nestjs/common';
import { NOTIFICATION_CHANNELS, NotificationChannel, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannel[],
  ) {}

  async notify(payload: NotificationPayload, preferredChannels: string[] = ['email']): Promise<void> {
    const channel = this.channels.find((c) => preferredChannels.includes(c.name));
    if (!channel) {
      this.logger.warn(`No hay canal habilitado para: ${preferredChannels.join(', ')}`);
      return;
    }
    await channel.send(payload);
  }
}
