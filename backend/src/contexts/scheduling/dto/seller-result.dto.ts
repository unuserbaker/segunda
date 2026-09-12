import { IsIn } from 'class-validator';

export class SellerResultDto {
  @IsIn(['atendido', 'no_se_presento'])
  result!: 'atendido' | 'no_se_presento';
}
