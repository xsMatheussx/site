import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ProductType, ProductStatus } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(3, 120) name?: string;
  @IsOptional() @IsString() @Length(3, 160) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug?: string;
  @IsOptional() @IsString() @Length(10, 5000) description?: string;
  @IsOptional() @IsString() @Length(0, 1000) coverUrl?: string;
  @IsOptional() @IsString() @Length(2, 80) category?: string;
  @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
}
