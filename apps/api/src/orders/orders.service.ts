import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { OrderStatus, PaymentStatus, Prisma } from "@algi/database";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import { CreateOrderDto } from "./create-order.dto";
import { PaymentsService } from "../payments/payments.service";
import { DeliveryService } from "../delivery/delivery.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>, private readonly payments: PaymentsService, private readonly delivery: DeliveryService) {}

  async create(input: CreateOrderDto, idempotencyKey: string) {
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 200) {
      throw new BadRequestException("Передайте Idempotency-Key длиной от 12 до 200 символов");
    }
    const duplicateIds = input.items.map(i => i.variantId);
    if (new Set(duplicateIds).size !== duplicateIds.length) throw new BadRequestException("Одинаковые позиции нужно объединить");
    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true, payments: true } });
    if (existing) {
      if (!existing.payments.length) await this.payments.createForOrder(existing, `pay:${idempotencyKey}`);
      const refreshed = await this.prisma.order.findUniqueOrThrow({ where: { id: existing.id }, include: { items: true, payments: true } });
      return this.publicOrder(refreshed);
    }
    const destinationCityCode = typeof input.deliveryAddress?.cdekCityCode === "number" ? input.deliveryAddress.cdekCityCode : undefined;
    const deliveryQuote = this.delivery.verify(input.deliveryQuoteToken, input.deliveryMethod, input.items, destinationCityCode);

    try {
      const order = await this.prisma.$transaction(async tx => {
        const variants = await tx.productVariant.findMany({
          where: { id: { in: input.items.map(i => i.variantId) }, isActive: true, product: { status: "ACTIVE", deletedAt: null } },
          include: { product: { select: { name: true } } },
        });
        if (variants.length !== input.items.length) throw new NotFoundException("Один из товаров недоступен");
        let subtotal = 0;
        const lines = input.items.map(item => {
          const variant = variants.find(v => v.id === item.variantId)!;
          if (variant.stockQty - variant.reservedQty < item.quantity) throw new ConflictException(`Недостаточно товара: ${variant.product.name}`);
          const total = variant.priceKopecks * item.quantity; subtotal += total;
          return { variant, quantity: item.quantity, total };
        });
        let discount = 0; const promoCode = input.promoCode?.trim().toUpperCase();
        if (promoCode) {
          const now = new Date(); const promo = await tx.promotion.findUnique({ where: { code: promoCode } });
          if (!promo?.isActive || (promo.startsAt && promo.startsAt > now) || (promo.endsAt && promo.endsAt < now) || (promo.maxUses !== null && promo.usedCount >= promo.maxUses)) throw new BadRequestException("Промокод недействителен");
          if (subtotal < promo.minSubtotalKopecks) throw new BadRequestException("Сумма заказа недостаточна для промокода");
          discount = promo.discountType === "PERCENT" ? Math.floor(subtotal * promo.discountValue / 100) : promo.discountValue;
          discount = Math.min(discount, subtotal);
          await tx.promotion.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
        }
        for (const line of lines) await tx.productVariant.update({ where: { id: line.variant.id }, data: { reservedQty: { increment: line.quantity } } });
        const delivery = deliveryQuote.priceKopecks;
        const minutes = this.config.get("ORDER_RESERVATION_MINUTES", { infer: true });
        const created = await tx.order.create({
          data: {
            publicId: this.publicId(), idempotencyKey, status: OrderStatus.AWAITING_PAYMENT,
            customerName: input.customerName.trim(), customerPhone: input.customerPhone,
            customerEmail: input.customerEmail?.toLowerCase(), deliveryMethod: input.deliveryMethod,
            deliveryAddress: input.deliveryAddress as Prisma.InputJsonValue | undefined,
            customerComment: input.customerComment?.trim(), subtotalKopecks: subtotal, deliveryKopecks: delivery,
            discountKopecks: discount, promoCode, totalKopecks: subtotal - discount + delivery, expiresAt: new Date(Date.now() + minutes * 60_000),
            items: { create: lines.map(({ variant, quantity, total }) => ({ variantId: variant.id, sku: variant.sku, productName: variant.product.name, variantDescription: `${variant.weightG} г · ${variant.grind}`, quantity, unitPriceKopecks: variant.priceKopecks, totalKopecks: total })) },
            events: { create: { type: "ORDER_CREATED", payload: { source: "storefront" } } },
          }, include: { items: true },
        });
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5_000, timeout: 10_000 });
      await this.payments.createForOrder(order, `pay:${idempotencyKey}`);
      const withPayment = await this.prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, payments: true } });
      return this.publicOrder(withPayment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicate = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true, payments: true } });
        if (duplicate) return this.publicOrder(duplicate);
      }
      throw error;
    }
  }

  async byPublicId(publicId: string) {
    const order = await this.prisma.order.findUnique({ where: { publicId }, include: { items: true, payments: { select: { status: true, confirmationUrl: true } } } });
    if (!order) throw new NotFoundException("Заказ не найден");
    return this.publicOrder(order);
  }

  private publicId() { return `OR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`; }
  private publicOrder(order: {
    publicId: string; status: OrderStatus; deliveryMethod: string; subtotalKopecks: number; deliveryKopecks: number; discountKopecks: number; promoCode: string | null;
    totalKopecks: number; expiresAt: Date | null; paidAt: Date | null; createdAt: Date;
    items?: Array<{ sku: string; productName: string; variantDescription: string; quantity: number; unitPriceKopecks: number; totalKopecks: number }>;
    payments?: Array<{ status: PaymentStatus; confirmationUrl: string | null }>;
  }) {
    return {
      publicId: order.publicId, status: order.status, deliveryMethod: order.deliveryMethod,
      subtotalKopecks: order.subtotalKopecks, deliveryKopecks: order.deliveryKopecks, discountKopecks: order.discountKopecks, promoCode: order.promoCode, totalKopecks: order.totalKopecks,
      expiresAt: order.expiresAt, paidAt: order.paidAt, createdAt: order.createdAt,
      items: order.items?.map(({ sku, productName, variantDescription, quantity, unitPriceKopecks, totalKopecks }) => ({ sku, productName, variantDescription, quantity, unitPriceKopecks, totalKopecks })),
      payments: order.payments?.map(({ status, confirmationUrl }) => ({ status, confirmationUrl })),
    };
  }
}
