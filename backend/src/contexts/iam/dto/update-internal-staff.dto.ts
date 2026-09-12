import { IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateInternalStaffDto {
  @IsOptional()
  @IsIn(['admin', 'asesor', 'operador'])
  role?: 'admin' | 'asesor' | 'operador';

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
