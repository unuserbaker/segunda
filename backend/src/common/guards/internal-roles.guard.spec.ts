import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalRolesGuard } from './internal-roles.guard';

function buildContext(internalRole: string | null | undefined): ExecutionContext {
  const request = { user: internalRole === undefined ? {} : { internalRole } };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('InternalRolesGuard', () => {
  let reflector: Reflector;
  let guard: InternalRolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new InternalRolesGuard(reflector);
  });

  it('permite el acceso si no hay roles requeridos (metadata vacía)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = buildContext('operador');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso si requiredRoles es un array vacío', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = buildContext('operador');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando el internalRole del usuario está en la lista requerida (admin)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'asesor']);
    const ctx = buildContext('admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando el internalRole del usuario está en la lista requerida (asesor)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'asesor']);
    const ctx = buildContext('asesor');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rechaza cuando el internalRole del usuario no está en la lista requerida (operador)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'asesor']);
    const ctx = buildContext('operador');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rechaza cuando el usuario no tiene internalRole (null)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = buildContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rechaza cuando request.user no tiene la propiedad internalRole (undefined)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = buildContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
