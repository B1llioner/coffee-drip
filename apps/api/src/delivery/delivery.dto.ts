import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";

export class DeliveryQuoteItemDto { @IsUUID() variantId!: string; @IsInt() @Min(1) quantity!: number; }
export class DeliveryQuoteDto {
  @IsIn(["PICKUP", "COURIER", "CDEK"]) method!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) destinationCityCode?: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => DeliveryQuoteItemDto) items!: DeliveryQuoteItemDto[];
}
