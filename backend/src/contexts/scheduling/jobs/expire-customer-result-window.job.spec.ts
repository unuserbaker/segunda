jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_HOUR: '0 * * * *' },
}));

import { ExpireCustomerResultWindowJob } from './expire-customer-result-window.job';

describe('ExpireCustomerResultWindowJob', () => {
  it('expira la ventana de cada token vencido encontrado por el servicio', async () => {
    const appointmentService = {
      findExpiredCustomerResultTokenIds: jest.fn().mockResolvedValue(['appt-1', 'appt-2']),
      expireCustomerResultWindow: jest.fn().mockResolvedValue(undefined),
    } as any;

    const job = new ExpireCustomerResultWindowJob(appointmentService);
    await job.handle();

    expect(appointmentService.findExpiredCustomerResultTokenIds).toHaveBeenCalled();
    expect(appointmentService.expireCustomerResultWindow).toHaveBeenCalledTimes(2);
    expect(appointmentService.expireCustomerResultWindow).toHaveBeenNthCalledWith(1, 'appt-1');
    expect(appointmentService.expireCustomerResultWindow).toHaveBeenNthCalledWith(2, 'appt-2');
  });

  it('no hace nada si no hay tokens vencidos', async () => {
    const appointmentService = {
      findExpiredCustomerResultTokenIds: jest.fn().mockResolvedValue([]),
      expireCustomerResultWindow: jest.fn().mockResolvedValue(undefined),
    } as any;

    const job = new ExpireCustomerResultWindowJob(appointmentService);
    await job.handle();

    expect(appointmentService.expireCustomerResultWindow).not.toHaveBeenCalled();
  });
});
