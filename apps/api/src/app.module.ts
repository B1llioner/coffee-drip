import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./config/env";
import { DatabaseModule } from "./common/database.module";
import { HealthController } from "./health/health.controller";
import { LeadsModule } from "./leads/leads.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CompanyModule } from "./company/company.module";
import { OrdersModule } from "./orders/orders.module";
import { AdminModule } from "./admin/admin.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrivacyModule } from "./privacy/privacy.module";
import { DeliveryModule } from "./delivery/delivery.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: ["../../.env", ".env"], validate: validateEnv }),
    DatabaseModule,
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    LeadsModule,
    CatalogModule,
    CompanyModule,
    OrdersModule,
    AdminModule,
    PaymentsModule,
    PrivacyModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
