import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsDecimal,
  Length,
} from 'class-validator';

export class CreateVehicleDto {
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  mileage!: number;

  @IsString()
  @Length(1, 10)
  plate!: string;

  @IsOptional()
  @IsNumber()
  engineTypeId?: number;

  @IsOptional()
  @IsNumber()
  transmissionId?: number;

  @IsOptional()
  @IsNumber()
  typeId?: number;

  @IsOptional()
  @IsNumber()
  statusId?: number;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
