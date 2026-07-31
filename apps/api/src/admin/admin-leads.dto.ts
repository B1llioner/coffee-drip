import { LeadStatus } from "@algi/database";
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateAdminLeadDto {
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsOptional() @IsISO8601() nextActionAt?: string;
}

export class CreateAdminLeadNoteDto {
  @IsString() @MaxLength(5_000) body!: string;
}
