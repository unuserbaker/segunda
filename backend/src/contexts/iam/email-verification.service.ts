import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { EmailVerification } from './entities/email-verification.entity';

const TOKEN_TTL_HOURS = 24;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly verificationRepo: Repository<EmailVerification>,
  ) {}

  /** Idempotente: si el usuario no existe o ya está verificado, no revela nada al llamador. */
  async requestVerification(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || user.email_verified_at) {
      return { message: 'Si tu email requiere verificación, recibirás un correo en breve.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user_id: user.id,
        token: hashToken(rawToken),
        expires_at: expiresAt,
        consumed_at: null,
      }),
    );

    // Modo log-only para MVP: se conecta un EmailChannel real en `notifications` a futuro.
    this.logger.log(
      `[email-verification] Enviar a ${user.email} el link de verificación con token=${rawToken}`,
    );

    return { message: 'Si tu email requiere verificación, recibirás un correo en breve.' };
  }

  async confirmVerification(token: string): Promise<{ message: string }> {
    const hashed = hashToken(token);
    const verification = await this.verificationRepo.findOneBy({ token: hashed });

    if (!verification || verification.consumed_at || verification.expires_at < new Date()) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    await this.verificationRepo.update(verification.id, { consumed_at: new Date() });
    await this.userRepo.update(verification.user_id, { email_verified_at: new Date() });

    return { message: 'Email verificado correctamente' };
  }
}
