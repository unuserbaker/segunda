jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_HOUR: '0 * * * *' },
}));

import { SendCloseOfCycleLinkJob } from './send-close-of-cycle-link.job';

describe('SendCloseOfCycleLinkJob', () => {
  it('genera el token y notifica el link de cierre de ciclo para cada cita pendiente', async () => {
    const appointments = [
      { id: 'appt-1', buyer_id: 'buyer-1' },
      { id: 'appt-2', buyer_id: 'buyer-2' },
    ];
    const appointmentService = {
      findAppointmentsPendingCloseOfCycleLink: jest.fn().mockResolvedValue(appointments),
      generateCustomerResultToken: jest
        .fn()
        .mockImplementation((id: string) => Promise.resolve(`token-${id}`)),
    } as any;
    const notificationsService = {
      notify: jest.fn().mockResolvedValue(undefined),
    } as any;

    const job = new SendCloseOfCycleLinkJob(appointmentService, notificationsService);
    await job.handle();

    expect(appointmentService.generateCustomerResultToken).toHaveBeenCalledTimes(2);
    expect(appointmentService.generateCustomerResultToken).toHaveBeenCalledWith('appt-1');
    expect(appointmentService.generateCustomerResultToken).toHaveBeenCalledWith('appt-2');
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer-1',
        templateKey: 'appointment_closed_link',
        variables: { link: '/appointments/customer-result/token-appt-1' },
      }),
    );
    expect(notificationsService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer-2',
        templateKey: 'appointment_closed_link',
        variables: { link: '/appointments/customer-result/token-appt-2' },
      }),
    );
  });

  it('no hace nada si no hay citas pendientes de link de cierre', async () => {
    const appointmentService = {
      findAppointmentsPendingCloseOfCycleLink: jest.fn().mockResolvedValue([]),
      generateCustomerResultToken: jest.fn(),
    } as any;
    const notificationsService = { notify: jest.fn() } as any;

    const job = new SendCloseOfCycleLinkJob(appointmentService, notificationsService);
    await job.handle();

    expect(appointmentService.generateCustomerResultToken).not.toHaveBeenCalled();
    expect(notificationsService.notify).not.toHaveBeenCalled();
  });
});
