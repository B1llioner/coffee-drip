import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../common/prisma.service";
import { CreateAdminRefundDto, UpdateAdminOrderDto, UpsertShipmentDto } from "./admin-orders.dto";
import { AdminAuthGuard, type AdminRequest } from "./auth/admin-auth.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";
import { PaymentsService } from "../payments/payments.service";
import { randomUUID } from "node:crypto";

@ApiTags("admin-orders")
@Controller("admin/orders")
@UseGuards(AdminAuthGuard)
@AdminRoles("ADMIN", "MANAGER", "WAREHOUSE")
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService, private readonly payments: PaymentsService) {}

  @Get()
  list() {
    return this.prisma.order.findMany({
      include: { items: true, payments: { select: { provider: true, status: true, amountKopecks: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, payments: true, events: { orderBy: { createdAt: "desc" } } },
    });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAdminOrderDto, @Req() request: AdminRequest) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true, payments: true } });
      const allowed: Record<string, string[]> = {
        NEW: ["AWAITING_PAYMENT", "CANCELLED"], AWAITING_PAYMENT: ["PAID", "CANCELLED"],
        PAID: ["PROCESSING"], PROCESSING: ["SHIPPED"], SHIPPED: ["COMPLETED"],
        COMPLETED: [], CANCELLED: [], REFUNDED: [],
      };
      if (!allowed[current.status]?.includes(dto.status)) throw new BadRequestException(`Переход ${current.status} → ${dto.status} запрещён`);
      if (current.status === "AWAITING_PAYMENT" && dto.status === "PAID" && !current.payments.some((payment) => payment.provider === "MANUAL")) {
        throw new BadRequestException("Онлайн-платёж подтверждается только webhook провайдера");
      }
      if (current.status === "AWAITING_PAYMENT" && dto.status === "CANCELLED") {
        for (const item of current.items) await tx.productVariant.update({ where: { id: item.variantId }, data: { reservedQty: { decrement: item.quantity } } });
        await tx.payment.updateMany({ where: { orderId: id, status: "PENDING" }, data: { status: "FAILED" } });
        if (current.promoCode) await tx.promotion.updateMany({ where: { code: current.promoCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
      if (current.status === "AWAITING_PAYMENT" && dto.status === "PAID") {
        for (const item of current.items) await tx.productVariant.update({ where: { id: item.variantId }, data: { reservedQty: { decrement: item.quantity }, stockQty: { decrement: item.quantity } } });
        await tx.payment.updateMany({ where: { orderId: id, provider: "MANUAL", status: "PENDING" }, data: { status: "SUCCEEDED" } });
      }
      const updated = await tx.order.update({ where: { id }, data: { status: dto.status, ...(dto.status === "PAID" ? { paidAt: new Date() } : {}) } });
      await tx.orderEvent.create({ data: { orderId: id, type: "STATUS_CHANGED", payload: { status: dto.status } } });
      await tx.auditLog.create({
        data: { actorId: request.adminUser!.id, action: "order.status.update", entityType: "order", entityId: id, changes: { status: dto.status } },
      });
      return updated;
    });
    return order;
  }

  @Post(":id/refunds") @AdminRoles("ADMIN")
  async refund(@Param("id") id: string, @Body() dto: CreateAdminRefundDto, @Req() request: AdminRequest) {
    const result = await this.payments.refundOrder(id, dto.amountKopecks, dto.reason, `refund:${randomUUID()}`);
    await this.prisma.auditLog.create({ data: { actorId: request.adminUser!.id, action: "refund.create", entityType: "order", entityId: id, changes: { amountKopecks: dto.amountKopecks, reason: dto.reason } } });
    return result;
  }

  @Post(":id/shipment") @AdminRoles("ADMIN", "WAREHOUSE")
  async shipment(@Param("id") orderId: string, @Body() dto: UpsertShipmentDto, @Req() request: AdminRequest) {
    const shipment = await this.prisma.shipment.upsert({ where: { orderId }, update: dto, create: { orderId, ...dto } });
    await this.prisma.auditLog.create({ data: { actorId: request.adminUser!.id, action: "shipment.upsert", entityType: "order", entityId: orderId, changes: { provider: dto.provider, status: dto.status, trackingNumber: dto.trackingNumber } } });
    return shipment;
  }
}
