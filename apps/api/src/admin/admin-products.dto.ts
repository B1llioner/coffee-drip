import { Grind, ProductStatus, RoastLevel } from "@algi/database";
import { PartialType } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class CreateAdminProductDto {
  @IsString() @MaxLength(160) slug!: string;
  @IsString() @MaxLength(200) name!: string;
  @IsUUID() brandId!: string;
  @IsOptional() @IsString() @MaxLength(10_000) description?: string;
  @IsArray() @IsString({ each: true }) flavorDescriptors!: string[];
  @IsEnum(RoastLevel) roastLevel!: RoastLevel;
  @IsOptional() @IsBoolean() isDecaf?: boolean;
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsString() ingredients?: string;
  @IsOptional() @IsString() manufacturerName?: string;
  @IsOptional() @IsString() manufacturerAddress?: string;
  @IsOptional() @IsString() productionCountry?: string;
  @IsOptional() @IsInt() @Min(1) shelfLifeDays?: number;
  @IsOptional() @IsString() storageConditions?: string;
  @IsOptional() @IsString() preparation?: string;
  @IsOptional() @IsString() conformityDocument?: string;
}

export class UpdateAdminProductDto extends PartialType(CreateAdminProductDto) {}

export class CreateAdminVariantDto {
  @IsInt() @Min(1) @Max(100_000) weightG!: number;
  @IsEnum(Grind) grind!: Grind;
  @IsString() @MaxLength(100) sku!: string;
  @IsInt() @Min(0) priceKopecks!: number;
  @IsOptional() @IsInt() @Min(0) compareAtPrice?: number;
  @IsOptional() @IsInt() @Min(0) stockQty?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() gtin?: string;
  @IsOptional() @IsString() tnVedCode?: string;
  @IsOptional() @IsString() okpd2Code?: string;
  @IsOptional() @IsBoolean() markingRequired?: boolean;
}

export class UpdateAdminVariantDto extends PartialType(CreateAdminVariantDto) {}
