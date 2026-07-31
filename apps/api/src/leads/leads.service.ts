import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConsentPurpose } from "@algi/database";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import { CreateLeadDto } from "./create-lead.dto";
import { TelegramLeadNotifier } from "./telegram-lead.notifier";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly telegram: TelegramLeadNotifier,
  ) {}

  async create(dto: CreateLeadDto, context: { ip?: string; userAgent?: string }) {
    if (!dto.phone && !dto.email) throw new BadRequestException("Укажите телефон или email");
    if (!dto.consentAccepted) throw new BadRequestException("Необходимо отдельное согласие на обработку персональных данных");

    const consent = await this.prisma.consentDocument.findFirst({
      where: { purpose: ConsentPurpose.LEAD_RESPONSE, version: dto.consentVersion, isActive: true },
    });
    if (!consent) throw new BadRequestException("Версия согласия устарела. Обновите страницу и попробуйте снова");

    const retentionUntil = new Date();
    retentionUntil.setUTCDate(retentionUntil.getUTCDate() + this.config.get("LEAD_RETENTION_DAYS", { infer: true }));
    const publicId = `LD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const secret = this.config.get("IP_HASH_SECRET", { infer: true });
    const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
    const subjectRef = hash((dto.email ?? dto.phone ?? "").toLowerCase());

    const lead = await this.prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          publicId,
          audience: dto.audience,
          name: dto.name,
          phone: dto.phone,
          email: dto.email?.toLowerCase(),
          message: dto.message,
          sourcePage: dto.sourcePage,
          utm: dto.utm,
          retentionUntil,
        },
      });
      await tx.consentReceipt.create({
        data: {
          documentId: consent.id,
          leadId: created.id,
          subjectRef,
          ipHash: context.ip ? hash(context.ip) : null,
          userAgent: context.userAgent?.slice(0, 500),
          sourcePage: dto.sourcePage,
          collectionForm: "lead",
        },
      });
      await tx.leadNotification.create({ data: { leadId: created.id, channel: "telegram" } });
      return created;
    });

    this.telegram.kick();
    return { id: lead.publicId, status: "accepted" as const };
  }
}
