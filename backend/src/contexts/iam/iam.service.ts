import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InternalStaff } from './entities/internal-staff.entity';

/**
 * Servicio delgado de `iam`, pensado para ser consumido cross-context (ej. `scheduling`).
 * Nunca expone los repositorios directamente a otros contexts.
 */
@Injectable()
export class IamService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InternalStaff)
    private readonly internalStaffRepo: Repository<InternalStaff>,
  ) {}

  async getUserRole(userId: string): Promise<'buyer' | 'seller' | null> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return null;
    return user.role as 'buyer' | 'seller';
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOneBy({ id: userId });
    return !!user?.email_verified_at;
  }

  async getInternalStaffRole(
    userId: string,
  ): Promise<'admin' | 'asesor' | 'operador' | null> {
    const staff = await this.internalStaffRepo.findOneBy({ user_id: userId, active: true });
    return (staff?.role as 'admin' | 'asesor' | 'operador') ?? null;
  }
}
