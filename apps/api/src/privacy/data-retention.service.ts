import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { Prisma } from "@algi/database";

@Injectable()
export class DataRetentionService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly prisma: PrismaService) {}
  onModuleInit() { this.timer = setInterval(() => void this.run(), 24 * 60 * 60 * 1000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async run() {
    const now = new Date();
    await this.prisma.lead.updateMany({ where: { retentionUntil: { lt: now }, deletedAt: null }, data: { name: "Удалено по сроку хранения", phone: null, email: null, message: null, utm: Prisma.DbNull, status: "DELETED", deletedAt: now } });
    await this.prisma.privacyRequest.deleteMany({ where: { retentionUntil: { lt: now }, status: { in: ["COMPLETED", "REJECTED"] } } });
    await this.prisma.session.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] } });
  }
}
