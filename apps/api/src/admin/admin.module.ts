import { Module } from "@nestjs/common";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminLeadsController } from "./admin-leads.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminProductsController } from "./admin-products.controller";
import { AdminAuthController } from "./auth/admin-auth.controller";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { AdminAuthService } from "./auth/admin-auth.service";
import { AdminOperationsController } from "./admin-operations.controller";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [PaymentsModule],
  controllers: [AdminAuthController, AdminDashboardController, AdminProductsController, AdminLeadsController, AdminOrdersController, AdminOperationsController],
  providers: [AdminAuthService, AdminAuthGuard],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminModule {}
