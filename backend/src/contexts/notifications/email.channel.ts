import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationChannel, NotificationPayload } from './notification-channel.interface';
import { renderTemplate } from './templates';

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = 'email' as const;
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
      this.logger.warn(
        'SMTP no configurado (SMTP_HOST/PORT/USER/PASS). EmailChannel funciona en modo log-only.',
      );
    }
  }

  async send(payload: NotificationPayload): Promise<void> {
    const { subject, body } = renderTemplate(payload.templateKey, payload.variables);

    if (!this.transporter) {
      this.logger.log(
        `[email:log-only] to=${payload.to} subject="${subject}" template=${payload.templateKey} body=${body}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@segunda.local',
      to: payload.to,
      subject,
      html: body,
    });
  }
}
