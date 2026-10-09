import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class PaymentAccountDto {
  @IsString() @IsIn(['pagarme']) provider!: string;
  @IsString() @MaxLength(100) externalRecipientId!: string;
  @IsOptional() @IsString() @MaxLength(30) status?: string;
}
