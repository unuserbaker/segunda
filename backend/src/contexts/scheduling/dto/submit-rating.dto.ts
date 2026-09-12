import { IsIn, IsInt, IsString, Min, Max, Length } from 'class-validator';

export class SubmitRatingDto {
  @IsIn(['seller', 'buyer'])
  raterRole!: 'seller' | 'buyer';

  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @IsString()
  @Length(1, 50)
  label!: string;
}
