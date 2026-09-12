// @nestjs/schedule es un paquete ESM puro; se mockea para que ts-jest (CJS) pueda parsear
// el decorador @Cron sin necesitar transformIgnorePatterns adicionales.
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_HOUR: '0 * * * *' },
}));

import { ReleaseExpiredSlotsJob } from './release-expired-slots.job';

describe('ReleaseExpiredSlotsJob', () => {
  it('libera cada slot expirado encontrado por el servicio', async () => {
    const appointmentService = {
      findActiveAppointmentIdsForRelease: jest.fn().mockResolvedValue(['appt-1', 'appt-2']),
      releaseExpiredSlot: jest.fn().mockResolvedValue(undefined),
    } as any;

    const job = new ReleaseExpiredSlotsJob(appointmentService);
    await job.handle();

    expect(appointmentService.findActiveAppointmentIdsForRelease).toHaveBeenCalled();
    expect(appointmentService.releaseExpiredSlot).toHaveBeenCalledTimes(2);
    expect(appointmentService.releaseExpiredSlot).toHaveBeenNthCalledWith(1, 'appt-1');
    expect(appointmentService.releaseExpiredSlot).toHaveBeenNthCalledWith(2, 'appt-2');
  });

  it('no llama a releaseExpiredSlot si no hay ids pendientes', async () => {
    const appointmentService = {
      findActiveAppointmentIdsForRelease: jest.fn().mockResolvedValue([]),
      releaseExpiredSlot: jest.fn().mockResolvedValue(undefined),
    } as any;

    const job = new ReleaseExpiredSlotsJob(appointmentService);
    await job.handle();

    expect(appointmentService.releaseExpiredSlot).not.toHaveBeenCalled();
  });
});
