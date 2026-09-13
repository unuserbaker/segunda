import { JwtStrategy } from './jwt.strategy';
import { InternalStaff } from '../entities/internal-staff.entity';
import { Seller } from '../../sellers/entities/seller.entity';
import { Repository } from 'typeorm';

describe('JwtStrategy.validate', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function buildStrategy(findOneBy: jest.Mock, sellerFindOneBy: jest.Mock = jest.fn().mockResolvedValue(null)) {
    const repo = { findOneBy } as unknown as Repository<InternalStaff>;
    const sellerRepo = { findOneBy: sellerFindOneBy } as unknown as Repository<Seller>;
    return new JwtStrategy(repo, sellerRepo);
  }

  const payload = { sub: 'user-123', email: 'user@test.com', role: 'buyer' };

  it('adjunta internalRole cuando existe un InternalStaff activo', async () => {
    const findOneBy = jest.fn().mockResolvedValue({ role: 'admin', active: true });
    const strategy = buildStrategy(findOneBy);

    const result = await strategy.validate(payload);

    expect(findOneBy).toHaveBeenCalledWith({ user_id: payload.sub, active: true });
    expect(result).toEqual({
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      internalRole: 'admin',
      sellerVerified: null,
    });
  });

  it('devuelve internalRole null cuando no existe un InternalStaff para el usuario', async () => {
    const findOneBy = jest.fn().mockResolvedValue(null);
    const strategy = buildStrategy(findOneBy);

    const result = await strategy.validate(payload);

    expect(result.internalRole).toBeNull();
  });

  it('devuelve internalRole null cuando el InternalStaff existe pero está inactivo (no lo encuentra por el filtro active:true)', async () => {
    // findOneBy con { active: true } no debería encontrar registros con active=false;
    // simulamos ese comportamiento devolviendo null tal como haría TypeORM.
    const findOneBy = jest.fn().mockResolvedValue(null);
    const strategy = buildStrategy(findOneBy);

    const result = await strategy.validate(payload);

    expect(findOneBy).toHaveBeenCalledWith({ user_id: payload.sub, active: true });
    expect(result.internalRole).toBeNull();
  });

  it('siempre retorna id/userId/email/role tomados del payload independientemente del staff', async () => {
    const findOneBy = jest.fn().mockResolvedValue(null);
    const strategy = buildStrategy(findOneBy);

    const result = await strategy.validate(payload);

    expect(result.id).toBe(payload.sub);
    expect(result.userId).toBe(payload.sub);
    expect(result.email).toBe(payload.email);
    expect(result.role).toBe(payload.role);
  });

  it('resuelve sellerVerified cuando el payload.role es seller', async () => {
    const findOneBy = jest.fn().mockResolvedValue(null);
    const sellerFindOneBy = jest.fn().mockResolvedValue({ verified: true });
    const strategy = buildStrategy(findOneBy, sellerFindOneBy);

    const result = await strategy.validate({ ...payload, role: 'seller' });

    expect(sellerFindOneBy).toHaveBeenCalledWith({ user_id: payload.sub });
    expect(result.sellerVerified).toBe(true);
  });

  it('no consulta Seller ni resuelve sellerVerified cuando el payload.role no es seller', async () => {
    const findOneBy = jest.fn().mockResolvedValue(null);
    const sellerFindOneBy = jest.fn();
    const strategy = buildStrategy(findOneBy, sellerFindOneBy);

    const result = await strategy.validate(payload);

    expect(sellerFindOneBy).not.toHaveBeenCalled();
    expect(result.sellerVerified).toBeNull();
  });
});
