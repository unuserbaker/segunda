import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { INTERNAL_ROLES_KEY } from '../decorators/internal-roles.decorator';

@Injectable()
export class InternalRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(INTERNAL_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const internalRole = request.user?.internalRole;

    if (!internalRole || !requiredRoles.includes(internalRole)) {
      throw new ForbiddenException('No tienes permisos de rol interno para esta acción');
    }

    return true;
  }
}
