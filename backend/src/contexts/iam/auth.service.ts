import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Seller } from '../sellers/entities/seller.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const role = dto.role || 'buyer';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let user: User;
    let seller: Seller | undefined;
    try {
      const userRepo = queryRunner.manager.getRepository(User);
      user = userRepo.create({
        email: dto.email,
        password: hashed,
        name: dto.name,
        role,
      });
      user = await userRepo.save(user);

      if (role === 'seller') {
        const sellerRepo = queryRunner.manager.getRepository(Seller);
        seller = sellerRepo.create({
          user_id: user.id,
          business_name: dto.business_name,
          tax_id: dto.tax_id,
          phone: dto.phone,
          verified: false,
        });
        seller = await sellerRepo.save(seller);
      }

      await queryRunner.commitTransaction();
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      if (err?.code === '23505' && String(err?.detail || '').includes('tax_id')) {
        throw new ConflictException('Ya existe una concesionaria registrada con este NIT');
      }
      throw err;
    } finally {
      await queryRunner.release();
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      seller: seller
        ? {
            id: seller.id,
            business_name: seller.business_name,
            tax_id: seller.tax_id,
            phone: seller.phone,
            verified: seller.verified,
          }
        : undefined,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
