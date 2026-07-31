import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { OrderExpirationService } from "./order-expiration.service";
import { DeliveryModule } from "../delivery/delivery.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
@Module({ imports: [PaymentsModule, DeliveryModule], controllers: [OrdersController], providers: [OrdersService, OrderExpirationService] })
export class OrdersModule {}
