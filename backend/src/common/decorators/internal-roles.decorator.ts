import { SetMetadata } from '@nestjs/common';

export const INTERNAL_ROLES_KEY = 'internalRoles';
export const InternalRoles = (...roles: string[]) => SetMetadata(INTERNAL_ROLES_KEY, roles);
