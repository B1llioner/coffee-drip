import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post("yookassa/webhook") webhook(@Body() body: { event?: string; object?: { id?: string } }) { return this.payments.processNotification(body); }
}
