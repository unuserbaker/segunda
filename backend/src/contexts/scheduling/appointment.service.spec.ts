import { AppointmentService } from './appointment.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('AppointmentService', () => {
  let appointmentRepo: any;
  let ratingRepo: any;
  let disputeNoteRepo: any;
  let dataSource: any;
  let vehicleService: any;
  let iamService: any;
  let settingsService: any;
  let businessEvents: any;
  let notificationsService: any;
  let service: AppointmentService;

  let queryRunner: any;

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn(),
      },
    };

    appointmentRepo = {
      count: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    ratingRepo = {
      findOneBy: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'rating-1', ...x })),
    };
    disputeNoteRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(),
    };
    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    };
    vehicleService = {
      getSchedulingSummary: jest.fn(),
      releaseFromAppointment: jest.fn().mockResolvedValue(undefined),
      suggestAlternatives: jest.fn().mockResolvedValue([]),
    };
    iamService = {
      isEmailVerified: jest.fn(),
    };
    settingsService = {
      get: jest.fn(),
    };
    businessEvents = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    notificationsService = {
      notify: jest.fn().mockResolvedValue(undefined),
    };

    service = new AppointmentService(
      appointmentRepo,
      ratingRepo,
      disputeNoteRepo,
      dataSource,
      vehicleService,
      iamService,
      settingsService,
      businessEvents,
      notificationsService,
    );
  });

  describe('createAppointment', () => {
    const buyerId = 'buyer-1';
    const vehicleId = 'vehicle-1';
    const futureIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    function mockApptRepoInTx(savedAppointment: any) {
      const apptRepo = {
        create: jest.fn((x) => x),
        save: jest.fn().mockResolvedValue(savedAppointment),
      };
      const statusRepo = {
        findOneBy: jest.fn().mockResolvedValue({ id: 'status-active', str_code: 'active_appointment' }),
      };
      const vehicleRepo = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      // createAppointment llama getRepository en este orden: Appointment, Status, Vehicle.
      queryRunner.manager.getRepository
        .mockReturnValueOnce(apptRepo)
        .mockReturnValueOnce(statusRepo)
        .mockReturnValueOnce(vehicleRepo);
      return { apptRepo, statusRepo, vehicleRepo };
    }

    beforeEach(() => {
      iamService.isEmailVerified.mockResolvedValue(true);
      appointmentRepo.count.mockResolvedValue(0);
      settingsService.get.mockResolvedValue(4);
    });

    it('caso feliz: crea la cita y bloquea el vehiculo', async () => {
      vehicleService.getSchedulingSummary.mockResolvedValue({
        sellerId: 'seller-1',
        isBlocked: false,
      });
      const saved = {
        id: 'appt-1',
        vehicle_id: vehicleId,
        seller_id: 'seller-1',
        buyer_id: buyerId,
        scheduled_at: new Date(futureIso),
        status: 'agendada',
        release_at: new Date(),
      };
      const { vehicleRepo, statusRepo } = mockApptRepoInTx(saved);

      const result = await service.createAppointment(buyerId, vehicleId, futureIso);

      expect(result).toEqual(saved);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(statusRepo.findOneBy).toHaveBeenCalledWith({ str_code: 'active_appointment' });
      expect(vehicleRepo.update).toHaveBeenCalledWith(vehicleId, { status_id: 'status-active' });
      expect(businessEvents.record).toHaveBeenCalledWith(
        'visit_scheduled',
        'appointment',
        'appt-1',
        expect.objectContaining({ vehicleId, buyerId, sellerId: 'seller-1' }),
      );
      expect(notificationsService.notify).toHaveBeenCalled();
    });

    it('rechaza si el vehiculo ya esta bloqueado (regla de negocio critica)', async () => {
      vehicleService.getSchedulingSummary.mockResolvedValue({
        sellerId: 'seller-1',
        isBlocked: true,
      });

      await expect(service.createAppointment(buyerId, vehicleId, futureIso)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.connect).not.toHaveBeenCalled();
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('rechaza si el email del comprador no esta verificado', async () => {
      iamService.isEmailVerified.mockResolvedValue(false);

      await expect(service.createAppointment(buyerId, vehicleId, futureIso)).rejects.toThrow(
        ForbiddenException,
      );
      expect(vehicleService.getSchedulingSummary).not.toHaveBeenCalled();
    });

    it('rechaza si el comprador ya tiene una cita activa agendada', async () => {
      appointmentRepo.count.mockResolvedValue(1);

      await expect(service.createAppointment(buyerId, vehicleId, futureIso)).rejects.toThrow(
        ConflictException,
      );
      expect(vehicleService.getSchedulingSummary).not.toHaveBeenCalled();
    });

    it('rechaza si el vehiculo no existe', async () => {
      vehicleService.getSchedulingSummary.mockResolvedValue(null);

      await expect(service.createAppointment(buyerId, vehicleId, futureIso)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si scheduledAt no es una fecha futura valida', async () => {
      vehicleService.getSchedulingSummary.mockResolvedValue({
        sellerId: 'seller-1',
        isBlocked: false,
      });
      const pastIso = new Date(Date.now() - 60 * 1000).toISOString();

      await expect(service.createAppointment(buyerId, vehicleId, pastIso)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('hace rollback si falla la escritura dentro de la transaccion', async () => {
      vehicleService.getSchedulingSummary.mockResolvedValue({
        sellerId: 'seller-1',
        isBlocked: false,
      });
      const apptRepo = {
        create: jest.fn((x) => x),
        save: jest.fn().mockRejectedValue(new Error('db down')),
      };
      queryRunner.manager.getRepository.mockReturnValue(apptRepo);

      await expect(service.createAppointment(buyerId, vehicleId, futureIso)).rejects.toThrow(
        'db down',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('confirmRsvp', () => {
    it('caso feliz: confirma el rsvp de una cita agendada dentro de la ventana', async () => {
      const releaseAt = new Date(Date.now() + 60 * 60 * 1000);
      appointmentRepo.findOneBy
        .mockResolvedValueOnce({ id: 'appt-1', buyer_id: 'buyer-1', status: 'agendada', release_at: releaseAt })
        .mockResolvedValueOnce({ id: 'appt-1', buyer_id: 'buyer-1', status: 'agendada', rsvp_confirmed_at: new Date() });

      const result = await service.confirmRsvp('appt-1', 'buyer-1');

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        rsvp_confirmed_at: expect.any(Date),
      });
      expect(result.rsvp_confirmed_at).toBeTruthy();
    });

    it('rechaza confirmar una cita que no pertenece al buyer', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce({
        id: 'appt-1',
        buyer_id: 'otro-buyer',
        status: 'agendada',
        release_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      await expect(service.confirmRsvp('appt-1', 'buyer-1')).rejects.toThrow(ForbiddenException);
    });

    it('rechaza confirmar una cita ya cancelada/expirada (status distinto a agendada)', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce({
        id: 'appt-1',
        buyer_id: 'buyer-1',
        status: 'liberada',
        release_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      await expect(service.confirmRsvp('appt-1', 'buyer-1')).rejects.toThrow(ConflictException);
    });

    it('rechaza confirmar si la ventana de confirmacion ya expiro', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce({
        id: 'appt-1',
        buyer_id: 'buyer-1',
        status: 'agendada',
        release_at: new Date(Date.now() - 1000),
      });

      await expect(service.confirmRsvp('appt-1', 'buyer-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('releaseExpiredSlot', () => {
    it('libera el vehiculo y marca la cita como liberada cuando corresponde', async () => {
      appointmentRepo.findOneBy.mockResolvedValue({
        id: 'appt-1',
        vehicle_id: 'vehicle-1',
        status: 'agendada',
        rsvp_confirmed_at: null,
        release_at: new Date(Date.now() - 1000),
      });

      await service.releaseExpiredSlot('appt-1');

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', { status: 'liberada' });
      expect(vehicleService.releaseFromAppointment).toHaveBeenCalledWith('vehicle-1');
      expect(businessEvents.record).toHaveBeenCalledWith(
        'vehicle_reactivated',
        'appointment',
        'appt-1',
        expect.objectContaining({ vehicleId: 'vehicle-1' }),
      );
    });

    it('no hace nada si la cita no existe', async () => {
      appointmentRepo.findOneBy.mockResolvedValue(null);

      await service.releaseExpiredSlot('appt-inexistente');

      expect(appointmentRepo.update).not.toHaveBeenCalled();
      expect(vehicleService.releaseFromAppointment).not.toHaveBeenCalled();
    });

    it('no hace nada si el rsvp ya fue confirmado', async () => {
      appointmentRepo.findOneBy.mockResolvedValue({
        id: 'appt-1',
        vehicle_id: 'vehicle-1',
        status: 'agendada',
        rsvp_confirmed_at: new Date(),
        release_at: new Date(Date.now() - 1000),
      });

      await service.releaseExpiredSlot('appt-1');

      expect(appointmentRepo.update).not.toHaveBeenCalled();
      expect(vehicleService.releaseFromAppointment).not.toHaveBeenCalled();
    });

    it('no hace nada si la ventana de release aun no llego', async () => {
      appointmentRepo.findOneBy.mockResolvedValue({
        id: 'appt-1',
        vehicle_id: 'vehicle-1',
        status: 'agendada',
        rsvp_confirmed_at: null,
        release_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      await service.releaseExpiredSlot('appt-1');

      expect(appointmentRepo.update).not.toHaveBeenCalled();
      expect(vehicleService.releaseFromAppointment).not.toHaveBeenCalled();
    });
  });

  describe('cancelBySale', () => {
    it('cancela la cita pendiente y notifica alternativas cuando el vehiculo se vende', async () => {
      appointmentRepo.findOneBy.mockResolvedValue({
        id: 'appt-1',
        vehicle_id: 'vehicle-1',
        seller_id: 'seller-1',
        buyer_id: 'buyer-1',
        status: 'agendada',
      });
      settingsService.get.mockResolvedValue(3);
      vehicleService.suggestAlternatives.mockResolvedValue([{ id: 'alt-1' }, { id: 'alt-2' }]);

      await service.cancelBySale('vehicle-1');

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        status: 'cancelada_por_venta',
      });
      expect(vehicleService.suggestAlternatives).toHaveBeenCalledWith('seller-1', 'vehicle-1', 3);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'buyer-1',
          templateKey: 'sale_cancelled_alternatives',
          variables: { vehicleId: 'vehicle-1', alternatives: ['alt-1', 'alt-2'] },
        }),
      );
    });

    it('no hace nada si no hay cita agendada activa para ese vehiculo', async () => {
      appointmentRepo.findOneBy.mockResolvedValue(null);

      await service.cancelBySale('vehicle-1');

      expect(appointmentRepo.update).not.toHaveBeenCalled();
      expect(notificationsService.notify).not.toHaveBeenCalled();
    });
  });

  describe('recordSellerResult', () => {
    const appointmentId = 'appt-1';
    const sellerId = 'seller-1';
    const pastScheduledAt = new Date(Date.now() - 60 * 60 * 1000);

    function baseAppointment(overrides: any = {}) {
      return {
        id: appointmentId,
        seller_id: sellerId,
        buyer_id: 'buyer-1',
        vehicle_id: 'vehicle-1',
        status: 'agendada',
        scheduled_at: pastScheduledAt,
        seller_result: null,
        customer_result: null,
        ...overrides,
      };
    }

    it('registra "atendido" y resuelve el estado final sin liberar el vehiculo', async () => {
      appointmentRepo.findOneBy
        .mockResolvedValueOnce(baseAppointment())
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'atendido' }))
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'atendido', status: 'atendido' }));

      const result = await service.recordSellerResult(appointmentId, sellerId, 'atendido');

      expect(appointmentRepo.update).toHaveBeenCalledWith(appointmentId, {
        seller_result: 'atendido',
        seller_result_at: expect.any(Date),
      });
      expect(vehicleService.releaseFromAppointment).not.toHaveBeenCalled();
      expect(result.status).toBe('atendido');
    });

    it('registra "no_se_presento" y libera el vehiculo', async () => {
      appointmentRepo.findOneBy
        .mockResolvedValueOnce(baseAppointment())
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'no_se_presento' }))
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'no_se_presento', status: 'no_se_presento' }));

      await service.recordSellerResult(appointmentId, sellerId, 'no_se_presento');

      expect(vehicleService.releaseFromAppointment).toHaveBeenCalledWith('vehicle-1');
    });

    it('rechaza si el seller no es el dueno de la cita', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment({ seller_id: 'otro-seller' }));

      await expect(
        service.recordSellerResult(appointmentId, sellerId, 'atendido'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si la cita no esta en estado "agendada"', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment({ status: 'liberada' }));

      await expect(
        service.recordSellerResult(appointmentId, sellerId, 'atendido'),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza si la cita todavia no ha ocurrido', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(
        baseAppointment({ scheduled_at: new Date(Date.now() + 60 * 60 * 1000) }),
      );

      await expect(
        service.recordSellerResult(appointmentId, sellerId, 'atendido'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('recordCustomerResult', () => {
    const token = 'raw-token-123';

    function baseAppointment(overrides: any = {}) {
      return {
        id: 'appt-1',
        customer_result: null,
        customer_result_token_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        seller_result: 'atendido',
        ...overrides,
      };
    }

    it('registra el resultado del customer y no genera disputa cuando coincide (atendido/asisti)', async () => {
      appointmentRepo.findOneBy
        .mockResolvedValueOnce(baseAppointment())
        .mockResolvedValueOnce(baseAppointment({ customer_result: 'asisti' }))
        .mockResolvedValueOnce(baseAppointment({ customer_result: 'asisti', status: 'atendido' }));

      const result = await service.recordCustomerResult(token, 'asisti');

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        customer_result: 'asisti',
        customer_result_at: expect.any(Date),
      });
      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        status: 'atendido',
        is_disputed: false,
      });
      expect(result).toBeDefined();
    });

    it('marca disputa cuando el resultado del customer no coincide con el del seller', async () => {
      appointmentRepo.findOneBy
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'atendido' }))
        .mockResolvedValueOnce(baseAppointment({ seller_result: 'atendido', customer_result: 'no_pude_ir' }))
        .mockResolvedValueOnce(
          baseAppointment({ seller_result: 'atendido', customer_result: 'no_pude_ir', status: 'atendido' }),
        );

      await service.recordCustomerResult(token, 'no_pude_ir');

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        status: 'atendido',
        is_disputed: true,
      });
    });

    it('rechaza con token invalido', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(null);

      await expect(service.recordCustomerResult(token, 'asisti')).rejects.toThrow(NotFoundException);
    });

    it('rechaza si ya se registro el resultado del customer', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(
        baseAppointment({ customer_result: 'asisti' }),
      );

      await expect(service.recordCustomerResult(token, 'no_pude_ir')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rechaza si el link ya expiro', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(
        baseAppointment({ customer_result_token_expires_at: new Date(Date.now() - 1000) }),
      );

      await expect(service.recordCustomerResult(token, 'asisti')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resolveFinalState', () => {
    it('no cambia nada si el seller aun no registro resultado', async () => {
      const appointment = { id: 'appt-1', seller_result: null, customer_result: null } as any;

      const result = await service.resolveFinalState(appointment);

      expect(appointmentRepo.update).not.toHaveBeenCalled();
      expect(result).toBe(appointment);
    });

    it('persiste status=seller_result sin disputa si el customer aun no responde', async () => {
      const appointment = { id: 'appt-1', seller_result: 'atendido', customer_result: null } as any;
      appointmentRepo.findOneBy.mockResolvedValueOnce({ ...appointment, status: 'atendido' });

      await service.resolveFinalState(appointment);

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        status: 'atendido',
        is_disputed: false,
      });
    });

    it.each([
      ['atendido', 'asisti', false],
      ['no_se_presento', 'no_pude_ir', false],
      ['atendido', 'no_pude_ir', true],
      ['no_se_presento', 'asisti', true],
    ])('seller=%s customer=%s => is_disputed=%s', async (sellerResult, customerResult, expectedDisputed) => {
      const appointment = {
        id: 'appt-1',
        seller_result: sellerResult,
        customer_result: customerResult,
      } as any;
      appointmentRepo.findOneBy.mockResolvedValueOnce({ ...appointment });

      await service.resolveFinalState(appointment);

      expect(appointmentRepo.update).toHaveBeenCalledWith('appt-1', {
        status: sellerResult,
        is_disputed: expectedDisputed,
      });
    });
  });

  describe('submitRating', () => {
    const appointmentId = 'appt-1';

    function baseAppointment(overrides: any = {}) {
      return {
        id: appointmentId,
        seller_id: 'seller-1',
        buyer_id: 'buyer-1',
        seller_result: 'atendido',
        ...overrides,
      };
    }

    it('caso feliz: el seller califica una cita con resultado registrado', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment());
      ratingRepo.findOneBy.mockResolvedValueOnce(null);

      const result = await service.submitRating(appointmentId, 'seller-1', 'seller', 5, 'Excelente');

      expect(ratingRepo.save).toHaveBeenCalled();
      expect(result.stars).toBe(5);
      expect(businessEvents.record).toHaveBeenCalledWith(
        'rating_submitted',
        'appointment',
        appointmentId,
        expect.objectContaining({ raterRole: 'seller', stars: 5 }),
      );
    });

    it('rechaza si la cita aun no tiene resultado registrado', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment({ seller_result: null }));

      await expect(
        service.submitRating(appointmentId, 'seller-1', 'seller', 5, 'Excelente'),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza si el seller intenta calificar una cita que no es suya', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment({ seller_id: 'otro-seller' }));

      await expect(
        service.submitRating(appointmentId, 'seller-1', 'seller', 5, 'Excelente'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el buyer intenta calificar una cita que no es suya', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment({ buyer_id: 'otro-buyer' }));

      await expect(
        service.submitRating(appointmentId, 'buyer-1', 'buyer', 5, 'Excelente'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si ya existe una calificacion de ese rol para la cita', async () => {
      appointmentRepo.findOneBy.mockResolvedValueOnce(baseAppointment());
      ratingRepo.findOneBy.mockResolvedValueOnce({ id: 'existing-rating' });

      await expect(
        service.submitRating(appointmentId, 'seller-1', 'seller', 5, 'Excelente'),
      ).rejects.toThrow(ConflictException);
    });

    // Fix QA: el service ahora valida el rango de `stars` (1-5) independientemente del DTO,
    // por si el metodo se invoca desde otro lugar en el futuro sin pasar por SubmitRatingDto.
    it('rechaza si stars esta fuera del rango 1-5 (defensa a nivel de servicio)', async () => {
      await expect(
        service.submitRating(appointmentId, 'seller-1', 'seller', 999, 'Excelente'),
      ).rejects.toThrow(BadRequestException);
      expect(appointmentRepo.findOneBy).not.toHaveBeenCalled();
      expect(ratingRepo.save).not.toHaveBeenCalled();
    });
  });
});
