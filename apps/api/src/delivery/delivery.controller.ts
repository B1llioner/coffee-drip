import { Body, Controller, Get, Post } from "@nestjs/common";
import { DeliveryQuoteDto } from "./delivery.dto";
import { DeliveryService } from "./delivery.service";

@Controller("delivery")
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}
  @Get("methods") methods() { return this.delivery.methods(); }
  @Post("quote") quote(@Body() dto: DeliveryQuoteDto) { return this.delivery.quote(dto); }
}
