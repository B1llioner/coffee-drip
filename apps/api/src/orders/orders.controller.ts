import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() @ApiOperation({ summary: "Создать заказ и зарезервировать остатки" })
  create(@Body() body: CreateOrderDto, @Headers("idempotency-key") key?: string) { return this.orders.create(body, key ?? ""); }
  @Get(":publicId") @ApiOperation({ summary: "Публичный статус заказа" })
  byId(@Param("publicId") id: string) { return this.orders.byPublicId(id); }
}
