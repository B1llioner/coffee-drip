import { PrivacyRequestType } from "@algi/database";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreatePrivacyRequestDto {
  @IsEnum(PrivacyRequestType) type!: PrivacyRequestType;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @Matches(/^\+[1-9]\d{7,14}$/) phone?: string;
  @IsOptional() @IsString() @MaxLength(3000) details?: string;
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}
