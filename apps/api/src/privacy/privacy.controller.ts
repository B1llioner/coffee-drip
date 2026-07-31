import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import { CreatePrivacyRequestDto } from "./privacy.dto";

@Controller("privacy")
export class PrivacyController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>) {}
  @Post("requests")
  async create(@Body() dto: CreatePrivacyRequestDto) {
    if (!dto.email && !dto.phone) throw new BadRequestException("Укажите email или телефон");
    const contact = (dto.email ?? dto.phone)!.toLowerCase();
    const subjectRef = createHmac("sha256", this.config.get("IP_HASH_SECRET", { infer: true })).update(contact).digest("hex");
    const request = await this.prisma.privacyRequest.create({ data: {
      publicId: `PD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`,
      type: dto.type, name: dto.name.trim(), email: dto.email?.toLowerCase(), phone: dto.phone, details: dto.details?.trim(), subjectRef,
      retentionUntil: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
    } });
    return { id: request.publicId, status: request.status };
  }
}
