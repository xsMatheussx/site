import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class PaymentAccountOnboardDto {
  @IsString()
  @MaxLength(80)
  provider!: string;

  @IsObject()
  registerInformation!: Record<string, unknown>;

  @IsObject()
  defaultBankAccount!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
