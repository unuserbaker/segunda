import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email/request')
  requestVerifyEmail(@Req() req: any) {
    return this.emailVerificationService.requestVerification(req.user.userId);
  }

  @Public()
  @Post('verify-email/confirm')
  confirmVerifyEmail(@Body() dto: ConfirmEmailVerificationDto) {
    return this.emailVerificationService.confirmVerification(dto.token);
  }
}
