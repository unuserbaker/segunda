import { IsIn } from 'class-validator';

export class CustomerResultDto {
  @IsIn(['asisti', 'no_pude_ir'])
  result!: 'asisti' | 'no_pude_ir';
}
