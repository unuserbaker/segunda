import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateInternalStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  name!: string;

  @IsIn(['admin', 'asesor', 'operador'])
  role!: 'admin' | 'asesor' | 'operador';
}
