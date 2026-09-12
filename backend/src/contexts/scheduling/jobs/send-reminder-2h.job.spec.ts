jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_HOUR: '0 * * * *' },
}));

import { SendReminder2hJob } from './send-reminder-2h.job';

describe('SendReminder2hJob', () => {
  it('consulta recordatorios a 2h (tolerancia 5min) y notifica reminder_2h por cada cita', async () => {
    const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
    const appointments = [{ id: 'appt-1', buyer_id: 'buyer-1', scheduled_at: scheduledAt }];
    const appointmentService = {
      findAppointmentsForReminder: jest.fn().mockResolvedValue(appointments),
    } as any;
    const notificationsService = { notify: jest.fn().mockResolvedValue(undefined) } as any;

    const job = new SendReminder2hJob(appointmentService, notificationsService);
    await job.handle();

    expect(appointmentService.findAppointmentsForReminder).toHaveBeenCalledWith(2, 5);
    expect(notificationsService.notify).toHaveBeenCalledTimes(1);
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer-1',
        templateKey: 'reminder_2h',
        variables: { scheduledAt: scheduledAt.toISOString() },
      }),
    );
  });

  it('no notifica nada si no hay citas en la ventana de 2h', async () => {
    const appointmentService = {
      findAppointmentsForReminder: jest.fn().mockResolvedValue([]),
    } as any;
    const notificationsService = { notify: jest.fn() } as any;

    const job = new SendReminder2hJob(appointmentService, notificationsService);
    await job.handle();

    expect(notificationsService.notify).not.toHaveBeenCalled();
  });
});
