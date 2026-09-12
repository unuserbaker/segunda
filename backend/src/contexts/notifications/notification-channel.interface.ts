export interface NotificationPayload {
  to: string;
  templateKey: string;
  variables: Record<string, unknown>;
}

export interface NotificationChannel {
  readonly name: 'email' | 'whatsapp' | 'sms';
  send(payload: NotificationPayload): Promise<void>;
}

export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';
