import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
  ) {}

  async findAll(page = 1, size = 10) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const [rows, totalItems] = await this.sellerRepo.findAndCount({
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / limit);
    return { currentPage: page, limit, totalPages, totalItems, rows };
  }

  async verify(id: string, verifiedBy: string) {
    const seller = await this.sellerRepo.findOneBy({ id });
    if (!seller) {
      throw new NotFoundException('Seller no encontrado');
    }

    if (seller.verified) {
      throw new ConflictException('El seller ya está verificado');
    }

    await this.sellerRepo.update(id, {
      verified: true,
      verified_by: verifiedBy,
      verified_at: new Date(),
    });

    return this.sellerRepo.findOneBy({ id });
  }

  /** Consumido por `scheduling` para mapear `User.id` (JWT) → `Seller.id` (dueño de la cita). */
  async findByUserId(userId: string): Promise<Seller | null> {
    return this.sellerRepo.findOneBy({ user_id: userId });
  }
}
