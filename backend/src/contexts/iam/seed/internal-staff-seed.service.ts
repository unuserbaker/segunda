import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { InternalStaff } from '../entities/internal-staff.entity';

@Injectable()
export class InternalStaffSeedService {
  private readonly logger = new Logger(InternalStaffSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InternalStaff)
    private readonly internalStaffRepo: Repository<InternalStaff>,
  ) {}

  async seedInitialAdmin() {
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !password) {
      this.logger.warn(
        'INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD no están definidos: se omite el seed del admin inicial.',
      );
      return;
    }

    let user = await this.userRepo.findOneBy({ email });

    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = await this.userRepo.save(
        this.userRepo.create({
          email,
          password: hashed,
          name: 'Admin inicial',
          role: 'buyer',
        }),
      );
    }

    const existingStaff = await this.internalStaffRepo.findOneBy({ user_id: user.id });
    if (existingStaff) {
      return;
    }

    await this.internalStaffRepo.save(
      this.internalStaffRepo.create({
        user_id: user.id,
        role: 'admin',
        active: true,
        created_by: null,
      }),
    );

    this.logger.log(`Admin inicial creado: ${email}`);
  }
}
