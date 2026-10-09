import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @IsString() @IsNotEmpty() @Length(3, 120) name!: string;
  @IsString() @IsNotEmpty() @Length(3, 160) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug inválido.' }) slug!: string;
  @IsString() @IsNotEmpty() @Length(10, 5000) description!: string;
  @IsOptional() @IsString() @Length(0, 1000) coverUrl?: string;
  @IsString() @IsNotEmpty() @Length(2, 80) category!: string;
  @IsEnum(ProductType) type!: ProductType;
}
