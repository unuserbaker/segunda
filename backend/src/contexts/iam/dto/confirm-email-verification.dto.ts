import { IsString, Length } from 'class-validator';

export class ConfirmEmailVerificationDto {
  @IsString()
  @Length(10, 255)
  token!: string;
}
