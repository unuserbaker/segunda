import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { IamService } from './iam.service';
import { InternalStaffController } from './internal-staff.controller';
import { InternalStaffService } from './internal-staff.service';
import { InternalStaffSeedService } from './seed/internal-staff-seed.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { InternalStaff } from './entities/internal-staff.entity';
import { EmailVerification } from './entities/email-verification.entity';

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está definido. Configúralo en el .env antes de arrancar la aplicación.',
  );
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, InternalStaff, EmailVerification]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    }),
  ],
  controllers: [AuthController, InternalStaffController],
  providers: [
    AuthService,
    EmailVerificationService,
    IamService,
    InternalStaffService,
    InternalStaffSeedService,
    JwtStrategy,
  ],
  exports: [AuthService, IamService, InternalStaffService, InternalStaffSeedService],
})
export class IamModule {}
