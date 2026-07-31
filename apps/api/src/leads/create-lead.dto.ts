import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsObject, IsOptional, IsString, Length, Matches, MaxLength } from "class-validator";
import { LeadAudience } from "@algi/database";

const trim = ({ value }: { value: unknown }) => typeof value === "string" ? value.trim() : value;

export class CreateLeadDto {
  @ApiProperty({ enum: LeadAudience })
  @IsEnum(LeadAudience)
  audience: LeadAudience;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ example: "+79990000000" })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+[1-9]\d{7,14}$/, { message: "phone must use E.164 format" })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiProperty({ example: "/cooperation" })
  @Transform(trim)
  @IsString()
  @Matches(/^\/[a-zA-Z0-9/_-]*$/)
  sourcePage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  utm?: Record<string, string>;

  @ApiProperty({ description: "Версия отдельного текста согласия, показанного пользователю" })
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  consentVersion: string;

  @ApiProperty({ description: "Должно быть явно выбрано пользователем" })
  @IsBoolean()
  consentAccepted: boolean;

  @ApiPropertyOptional({ description: "Honeypot; обычный пользователь оставляет поле пустым" })
  @IsOptional()
  @IsString()
  @MaxLength(0)
  website?: string;
}
