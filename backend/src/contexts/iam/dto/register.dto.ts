import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  business_name?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MaxLength(20)
  phone?: string;
}
