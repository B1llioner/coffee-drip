import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { RoastLevel } from "@algi/database";

export enum CatalogSort {
  POPULAR = "popular",
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  NEW = "new",
}

export class CatalogQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional({ enum: RoastLevel }) @IsOptional() @IsEnum(RoastLevel) roast?: RoastLevel;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === "true") @IsBoolean() decaf?: boolean;
  @ApiPropertyOptional({ enum: CatalogSort }) @IsOptional() @IsEnum(CatalogSort) sort: CatalogSort = CatalogSort.POPULAR;
  @ApiPropertyOptional({ minimum: 1, maximum: 48, default: 12 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48) limit = 12;
  @ApiPropertyOptional({ description: "Product UUID from the previous page" }) @IsOptional() @IsString() cursor?: string;
}
