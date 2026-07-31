import { OrderStatus } from "@algi/database";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateAdminOrderDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
export class CreateAdminRefundDto { @IsInt() @Min(1) amountKopecks!: number; @IsOptional() @IsString() @MaxLength(500) reason?: string; }
export class UpsertShipmentDto { @IsString() @MaxLength(40) provider!: string; @IsString() @MaxLength(40) status!: string; @IsOptional() @IsString() @MaxLength(120) externalId?: string; @IsOptional() @IsString() @MaxLength(120) trackingNumber?: string; @IsOptional() @IsString() @MaxLength(500) trackingUrl?: string; }
