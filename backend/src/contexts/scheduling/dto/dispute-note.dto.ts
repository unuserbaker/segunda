import { IsString, Length } from 'class-validator';

export class DisputeNoteDto {
  @IsString()
  @Length(1, 2000)
  note!: string;
}
