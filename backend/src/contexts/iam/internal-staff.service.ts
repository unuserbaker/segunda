import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { InternalStaff } from './entities/internal-staff.entity';
import { CreateInternalStaffDto } from './dto/create-internal-staff.dto';
import { UpdateInternalStaffDto } from './dto/update-internal-staff.dto';

@Injectable()
export class InternalStaffService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InternalStaff)
    private readonly internalStaffRepo: Repository<InternalStaff>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateInternalStaffDto, createdBy: string | null) {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    return this.dataSource.transaction(async (manager) => {
      const hashed = await bcrypt.hash(dto.password, 10);
      const user = manager.create(User, {
        email: dto.email,
        password: hashed,
        name: dto.name,
        role: 'buyer',
      });
      const savedUser = await manager.save(User, user);

      const staff = manager.create(InternalStaff, {
        user_id: savedUser.id,
        role: dto.role,
        active: true,
        created_by: createdBy,
      });
      const savedStaff = await manager.save(InternalStaff, staff);

      return {
        id: savedStaff.id,
        user_id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedStaff.role,
        active: savedStaff.active,
      };
    });
  }

  async findAll(page = 1, size = 10) {
    const limit = size;
    const offset = page > 0 ? (page - 1) * limit : 0;

    const [rows, totalItems] = await this.internalStaffRepo.findAndCount({
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    const userIds = rows.map((r) => r.user_id);
    const users = userIds.length
      ? await this.userRepo.find({ where: { id: In(userIds) } })
      : [];
    const usersById = new Map(users.map((u) => [u.id, u]));

    const mapped = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      email: usersById.get(r.user_id)?.email,
      name: usersById.get(r.user_id)?.name,
      role: r.role,
      active: r.active,
      created_at: r.created_at,
    }));

    const totalPages = Math.ceil(totalItems / limit);
    return { currentPage: page, limit, totalPages, totalItems, rows: mapped };
  }

  async update(id: string, dto: UpdateInternalStaffDto) {
    const staff = await this.internalStaffRepo.findOneBy({ id });
    if (!staff) {
      throw new NotFoundException('Cuenta interna no encontrada');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.active !== undefined) updateData.active = dto.active;

    if (Object.keys(updateData).length > 0) {
      await this.internalStaffRepo.update(id, updateData);
    }

    return this.internalStaffRepo.findOneBy({ id });
  }
}
