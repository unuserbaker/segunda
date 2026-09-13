import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SellerVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No aplica a roles internos ni a buyers — solo bloquea cuando el actor es
    // explícitamente un seller sin verificar.
    if (user?.role !== 'seller') return true;
    if (user?.sellerVerified !== true) {
      throw new ForbiddenException(
        'Tu cuenta de concesionaria está en revisión. No puedes publicar vehículos todavía.',
      );
    }
    return true;
  }
}
