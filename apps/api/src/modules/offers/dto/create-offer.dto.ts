import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateOfferDto {
  @IsString() @IsNotEmpty() @Length(2, 120) name!: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}
