import { IsOptional, IsBooleanString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AppointmentFilterDto extends PaginationDto {
  @IsOptional()
  @IsBooleanString()
  isDisputed?: string;
}
