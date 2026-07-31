import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { YooKassaProvider } from "./yookassa.provider";

@Module({ controllers: [PaymentsController], providers: [PaymentsService, YooKassaProvider], exports: [PaymentsService] })
export class PaymentsModule {}
