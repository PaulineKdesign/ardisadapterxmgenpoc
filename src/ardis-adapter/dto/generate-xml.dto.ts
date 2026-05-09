import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateXmlPartDto {
  @IsString()
  @IsNotEmpty()
  partReference!: string;

  @IsString()
  @IsNotEmpty()
  materialCode!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  lengthMm!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  widthMm!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  edge1?: string;

  @IsOptional()
  @IsString()
  edge2?: string;

  @IsOptional()
  @IsString()
  edge3?: string;

  @IsOptional()
  @IsString()
  edge4?: string;

  @IsOptional()
  @IsString()
  machiningRaw?: string;
}

export class GenerateXmlDto {
  @IsString()
  @IsNotEmpty()
  projectNumber!: string;

  @IsOptional()
  @IsString()
  customerAccount?: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  projectReference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GenerateXmlPartDto)
  parts!: GenerateXmlPartDto[];
}
