import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalStaff } from '../entities/internal-staff.entity';
import { Seller } from '../../sellers/entities/seller.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(InternalStaff)
    private readonly internalStaffRepo: Repository<InternalStaff>,
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error(
            'JWT_SECRET no está definido. Configúralo en el .env antes de arrancar la aplicación.',
          );
        }
        return process.env.JWT_SECRET;
      })(),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const staff = await this.internalStaffRepo.findOneBy({
      user_id: payload.sub,
      active: true,
    });

    const seller =
      payload.role === 'seller'
        ? await this.sellerRepo.findOneBy({ user_id: payload.sub })
        : null;

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      internalRole: staff?.role ?? null,
      sellerVerified: seller?.verified ?? null,
    };
  }
}
