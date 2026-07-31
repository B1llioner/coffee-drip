import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsObject, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
  @IsUUID() variantId!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateOrderDto {
  @IsString() @MaxLength(120) customerName!: string;
  @IsPhoneNumber("RU") customerPhone!: string;
  @IsOptional() @IsEmail() @MaxLength(254) customerEmail?: string;
  @IsIn(["PICKUP", "COURIER", "CDEK"]) deliveryMethod!: string;
  @IsString() @MaxLength(4000) deliveryQuoteToken!: string;
  @IsOptional() @IsObject() deliveryAddress?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(1000) customerComment?: string;
  @IsOptional() @IsString() @MaxLength(40) promoCode?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
