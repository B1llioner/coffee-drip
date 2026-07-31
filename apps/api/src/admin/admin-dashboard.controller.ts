import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../common/prisma.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";

@ApiTags("admin-dashboard")
@Controller("admin/dashboard")
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async dashboard() {
    const [products, lowStock, newLeads, failedNotifications] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.productVariant.count({ where: { isActive: true, stockQty: { lte: 5 } } }),
      this.prisma.lead.count({ where: { status: "NEW", deletedAt: null } }),
      this.prisma.leadNotification.count({ where: { status: "FAILED" } }),
    ]);
    return { products, lowStock, newLeads, failedNotifications };
  }
}
