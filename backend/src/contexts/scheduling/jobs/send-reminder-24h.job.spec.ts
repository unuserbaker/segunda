jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_HOUR: '0 * * * *' },
}));

import { SendReminder24hJob } from './send-reminder-24h.job';

describe('SendReminder24hJob', () => {
  it('consulta recordatorios a 24h y envia reminder_24h + rsvp_request por cada cita', async () => {
    const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
    const appointments = [{ id: 'appt-1', buyer_id: 'buyer-1', scheduled_at: scheduledAt }];
    const appointmentService = {
      findAppointmentsForReminder: jest.fn().mockResolvedValue(appointments),
    } as any;
    const notificationsService = { notify: jest.fn().mockResolvedValue(undefined) } as any;

    const job = new SendReminder24hJob(appointmentService, notificationsService);
    await job.handle();

    expect(appointmentService.findAppointmentsForReminder).toHaveBeenCalledWith(24);
    expect(notificationsService.notify).toHaveBeenCalledTimes(2);
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer-1',
        templateKey: 'reminder_24h',
        variables: { scheduledAt: scheduledAt.toISOString() },
      }),
    );
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer-1',
        templateKey: 'rsvp_request',
        variables: { scheduledAt: scheduledAt.toISOString() },
      }),
    );
  });

  it('no notifica nada si no hay citas en la ventana de 24h', async () => {
    const appointmentService = {
      findAppointmentsForReminder: jest.fn().mockResolvedValue([]),
    } as any;
    const notificationsService = { notify: jest.fn() } as any;

    const job = new SendReminder24hJob(appointmentService, notificationsService);
    await job.handle();

    expect(notificationsService.notify).not.toHaveBeenCalled();
  });
});
