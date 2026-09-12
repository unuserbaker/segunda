import { IsUUID, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  vehicleId!: string;

  @IsDateString()
  scheduledAt!: string;
}
