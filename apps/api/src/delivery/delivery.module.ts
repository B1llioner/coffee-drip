import { Module } from "@nestjs/common";
import { CdekProvider } from "./cdek.provider";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({ controllers: [DeliveryController], providers: [DeliveryService, CdekProvider], exports: [DeliveryService] })
export class DeliveryModule {}
