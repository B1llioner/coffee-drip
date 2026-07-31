import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class OrderExpirationService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.releaseExpired(), 30_000);
    this.timer.unref();
    void this.releaseExpired();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async releaseExpired() {
    if (this.running) return;
    this.running = true;
    try {
      const candidates = await this.prisma.order.findMany({
        where: { status: "AWAITING_PAYMENT", expiresAt: { lt: new Date() } },
        select: { id: true }, take: 50, orderBy: { expiresAt: "asc" },
      });
      for (const candidate of candidates) {
        await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.findUniqueOrThrow({ where: { id: candidate.id }, select: { promoCode: true } });
          const claimed = await tx.order.updateMany({ where: { id: candidate.id, status: "AWAITING_PAYMENT" }, data: { status: "CANCELLED" } });
          if (!claimed.count) return;
          const items = await tx.orderItem.findMany({ where: { orderId: candidate.id } });
          for (const item of items) await tx.productVariant.update({ where: { id: item.variantId }, data: { reservedQty: { decrement: item.quantity } } });
          if (order.promoCode) await tx.promotion.updateMany({ where: { code: order.promoCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
          await tx.orderEvent.create({ data: { orderId: candidate.id, type: "RESERVATION_EXPIRED" } });
        });
      }
    } finally { this.running = false; }
  }
}
