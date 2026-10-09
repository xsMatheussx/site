import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateProductFileDto {
  @IsString() @IsNotEmpty() @Length(1, 500) storageKey!: string;
  @IsString() @IsNotEmpty() @Length(1, 255) fileName!: string;
  @IsString() @IsNotEmpty() @Length(1, 120) mimeType!: string;
  @IsInt() @Min(1) size!: number;
}
