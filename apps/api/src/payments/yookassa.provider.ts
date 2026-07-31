import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnv } from "../config/env";
import type { PaymentOrder, PaymentProvider, ProviderPayment } from "./payment-provider";

type YooPayment = { id: string; status: string; amount: { value: string }; confirmation?: { confirmation_url?: string }; [key: string]: unknown };
const money = (kopecks: number) => (kopecks / 100).toFixed(2);

@Injectable()
export class YooKassaProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async create(order: PaymentOrder, idempotencyKey: string): Promise<ProviderPayment> {
    const vatCode = this.config.get("YOOKASSA_VAT_CODE", { infer: true })!;
    const items = order.items.map((item) => ({
      description: item.productName.slice(0, 128), quantity: item.quantity.toFixed(3),
      amount: { value: money(item.unitPriceKopecks), currency: "RUB" }, vat_code: vatCode,
      payment_mode: "full_prepayment", payment_subject: "commodity",
    }));
    if (order.deliveryKopecks > 0) items.push({
      description: "Доставка", quantity: "1.000", amount: { value: money(order.deliveryKopecks), currency: "RUB" },
      vat_code: vatCode, payment_mode: "full_prepayment", payment_subject: "service",
    });
    const customer = order.customerEmail ? { email: order.customerEmail } : { phone: order.customerPhone.replace(/\D/g, "") };
    const result = await this.call<YooPayment>("/payments", {
      method: "POST",
      idempotencyKey: idempotencyKey.slice(0, 64),
      body: {
        amount: { value: money(order.totalKopecks), currency: "RUB" }, capture: true,
        confirmation: { type: "redirect", return_url: `${this.config.get("YOOKASSA_RETURN_URL", { infer: true })}?order=${encodeURIComponent(order.publicId)}` },
        description: `Заказ ${order.publicId}`,
        metadata: { order_id: order.id, order_number: order.publicId },
        receipt: { customer, items },
      },
    });
    return { externalId: result.id, status: this.status(result.status), confirmationUrl: result.confirmation?.confirmation_url, raw: result };
  }

  async verify(externalId: string) {
    const result = await this.call<YooPayment>(`/payments/${encodeURIComponent(externalId)}`, { method: "GET" });
    return { status: this.status(result.status), amountKopecks: Math.round(Number(result.amount.value) * 100), raw: result };
  }

  async refund(externalPaymentId: string, amountKopecks: number, idempotencyKey: string, reason?: string) {
    const result = await this.call<{ id: string; status: string; [key: string]: unknown }>("/refunds", { method: "POST", idempotencyKey: idempotencyKey.slice(0, 64), body: { payment_id: externalPaymentId, amount: { value: money(amountKopecks), currency: "RUB" }, description: reason?.slice(0, 250) } });
    return { externalId: result.id, status: result.status === "succeeded" ? "SUCCEEDED" as const : result.status === "canceled" ? "FAILED" as const : "PENDING" as const, raw: result };
  }

  private status(status: string): ProviderPayment["status"] {
    if (status === "succeeded") return "SUCCEEDED";
    if (status === "canceled") return "FAILED";
    return "PENDING";
  }

  private async call<T>(path: string, options: { method: string; idempotencyKey?: string; body?: object }): Promise<T> {
    const shopId = this.config.get("YOOKASSA_SHOP_ID", { infer: true });
    const secret = this.config.get("YOOKASSA_SECRET_KEY", { infer: true });
    if (!shopId || !secret) throw new Error("ЮKassa не настроена");
    const response = await fetch(`https://api.yookassa.ru/v3${path}`, {
      method: options.method,
      headers: { authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`, "content-type": "application/json", ...(options.idempotencyKey ? { "Idempotence-Key": options.idempotencyKey } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json() as T & { description?: string };
    if (!response.ok) throw new Error(payload.description ?? `ЮKassa HTTP ${response.status}`);
    return payload;
  }
}
