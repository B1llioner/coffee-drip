import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentStatus, Prisma } from "@algi/database";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import type { PaymentOrder, PaymentProvider } from "./payment-provider";
import { YooKassaProvider } from "./yookassa.provider";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>, private readonly yoo: YooKassaProvider) {}

  async createForOrder(order: PaymentOrder, idempotencyKey: string) {
    const providerName = this.config.get<string>("PAYMENT_PROVIDER", "manual") as "manual" | "yookassa";
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing?.confirmationUrl || existing?.status === PaymentStatus.SUCCEEDED) return existing;
    const payment = existing ?? await this.prisma.payment.create({ data: { orderId: order.id, provider: providerName.toUpperCase(), idempotencyKey, status: PaymentStatus.PENDING, amountKopecks: order.totalKopecks } });
    if (providerName === "manual") return payment;
    try {
      const created = await this.provider().create(order, idempotencyKey);
      return this.prisma.payment.update({ where: { id: payment.id }, data: { externalId: created.externalId, status: created.status, confirmationUrl: created.confirmationUrl, rawResponse: created.raw } });
    } catch (error) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED, rawResponse: { error: error instanceof Error ? error.message : "Payment provider error" } } });
      throw error;
    }
  }

  async processNotification(input: { event?: string; object?: { id?: string } }) {
    const externalId = input.object?.id;
    if (!externalId) throw new BadRequestException("Некорректное уведомление");
    const local = await this.prisma.payment.findUnique({ where: { externalId }, include: { order: true } });
    if (!local) return { accepted: true };
    const verified = await this.provider().verify(externalId);
    if (verified.amountKopecks !== local.amountKopecks) throw new BadRequestException("Сумма платежа не совпадает");
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: local.id }, data: { status: verified.status, rawResponse: verified.raw } });
      if (verified.status === "SUCCEEDED") {
        const claimed = await tx.order.updateMany({ where: { id: local.orderId, status: "AWAITING_PAYMENT" }, data: { status: "PAID", paidAt: new Date() } });
        if (!claimed.count) return;
        await tx.orderEvent.create({ data: { orderId: local.orderId, type: "PAYMENT_SUCCEEDED", payload: { paymentId: local.id } } });
        for (const item of await tx.orderItem.findMany({ where: { orderId: local.orderId }, include: { variant: { select: { markingRequired: true } } } })) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { reservedQty: { decrement: item.quantity }, stockQty: { decrement: item.quantity } } });
          if (item.variant.markingRequired) {
            const units = await tx.markingUnit.findMany({ where: { variantId: item.variantId, status: "RECEIVED" }, orderBy: { createdAt: "asc" }, take: item.quantity });
            if (units.length < item.quantity) {
              await tx.orderEvent.create({ data: { orderId: local.orderId, type: "MARKING_SHORTAGE", payload: { variantId: item.variantId, required: item.quantity, found: units.length } } });
            } else {
              await tx.markingUnit.updateMany({ where: { id: { in: units.map((unit) => unit.id) } }, data: { status: "WITHDRAWAL_PENDING", withdrawalRef: local.order.publicId } });
            }
          }
        }
      }
    });
    return { accepted: true };
  }

  async refundOrder(orderId: string, amountKopecks: number, reason: string | undefined, idempotencyKey: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payments: true, refunds: true } });
    const payment = order.payments.find((item) => item.status === "SUCCEEDED");
    if (!payment) throw new BadRequestException("Нет успешного платежа для возврата");
    const refunded = order.refunds.filter((item) => item.status === "SUCCEEDED").reduce((sum, item) => sum + item.amountKopecks, 0);
    if (!Number.isInteger(amountKopecks) || amountKopecks <= 0 || amountKopecks > order.totalKopecks - refunded) throw new BadRequestException("Некорректная сумма возврата");
    const existing = await this.prisma.refund.findUnique({ where: { idempotencyKey } }); if (existing) return existing;
    const refund = await this.prisma.refund.create({ data: { orderId, paymentId: payment.id, idempotencyKey, amountKopecks, reason } });
    if (payment.provider === "MANUAL") return this.completeRefund(refund.id, orderId, amountKopecks, refunded, order.totalKopecks, { manual: true });
    if (!payment.externalId) throw new BadRequestException("У платежа нет идентификатора провайдера");
    try {
      const providerRefund = await this.yoo.refund(payment.externalId, amountKopecks, idempotencyKey, reason);
      const updated = await this.prisma.refund.update({ where: { id: refund.id }, data: { externalId: providerRefund.externalId, status: providerRefund.status, rawResponse: providerRefund.raw as Prisma.InputJsonValue } });
      if (providerRefund.status === "SUCCEEDED" && refunded + amountKopecks === order.totalKopecks) await this.prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
      return updated;
    } catch (error) {
      await this.prisma.refund.update({ where: { id: refund.id }, data: { status: "FAILED", rawResponse: { error: error instanceof Error ? error.message : "Refund error" } } }); throw error;
    }
  }

  private async completeRefund(refundId: string, orderId: string, amount: number, already: number, total: number, raw: object) {
    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({ where: { id: refundId }, data: { status: "SUCCEEDED", rawResponse: raw } });
      if (already + amount === total) await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
      await tx.orderEvent.create({ data: { orderId, type: "REFUND_SUCCEEDED", payload: { refundId, amountKopecks: amount } } }); return refund;
    });
  }

  private provider(): PaymentProvider { return this.yoo; }
}
