import { DiscountType, PrivacyRequestStatus, UserRole } from "@algi/database";
import { IsBoolean, IsEnum, IsIn, IsISO8601, IsNumber, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";

export class CreateAdminUserDto {
  @IsString() email!: string;
  @IsString() @MinLength(16) @MaxLength(200) password!: string;
  @IsString() @MaxLength(120) displayName!: string;
  @IsEnum(UserRole) role!: UserRole;
}
export class UpdateAdminUserDto {
  @IsOptional() @IsString() @MinLength(16) @MaxLength(200) password?: string;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateSettingDto { @IsObject() value!: Record<string, unknown>; }
export class CreateRoastBatchDto {
  @IsUUID() productId!: string;
  @IsISO8601() roastedAt!: string;
  @IsNumber() @Min(0.001) weightKg!: number;
  @IsOptional() @IsString() @MaxLength(500) profile?: string;
  @IsOptional() @IsString() @MaxLength(2000) cuppingNotes?: string;
}
export class CreateMarkingUnitDto {
  @IsUUID() variantId!: string;
  @IsString() @MinLength(8) @MaxLength(500) code!: string;
  @IsOptional() @IsString() @MaxLength(120) batchRef?: string;
}
export class UpdatePrivacyRequestDto { @IsEnum(PrivacyRequestStatus) status!: PrivacyRequestStatus; }
export class UpdateMarkingStatusDto { @IsIn(["INTRODUCED", "WITHDRAWAL_PENDING", "WITHDRAWN", "REJECTED"]) status!: string; @IsOptional() @IsString() @MaxLength(200) reference?: string; }
export class CreatePromotionDto {
  @IsString() @MaxLength(40) code!: string; @IsEnum(DiscountType) discountType!: DiscountType;
  @IsNumber() @Min(1) discountValue!: number; @IsOptional() @IsNumber() @Min(0) minSubtotalKopecks?: number;
  @IsOptional() @IsISO8601() startsAt?: string; @IsOptional() @IsISO8601() endsAt?: string;
  @IsOptional() @IsNumber() @Min(1) maxUses?: number; @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdatePromotionDto {
  @IsOptional() @IsEnum(DiscountType) discountType?: DiscountType; @IsOptional() @IsNumber() @Min(1) discountValue?: number;
  @IsOptional() @IsNumber() @Min(0) minSubtotalKopecks?: number; @IsOptional() @IsISO8601() startsAt?: string;
  @IsOptional() @IsISO8601() endsAt?: string; @IsOptional() @IsNumber() @Min(1) maxUses?: number; @IsOptional() @IsBoolean() isActive?: boolean;
}
