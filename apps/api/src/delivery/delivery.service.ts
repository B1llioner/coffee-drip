import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import { CdekProvider } from "./cdek.provider";
import type { DeliveryQuoteDto } from "./delivery.dto";

type QuotePayload = { method: string; items: string; priceKopecks: number; destinationCityCode?: number; meta?: object; expiresAt: number };
@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>, private readonly cdek: CdekProvider) {}
  methods() { return { pickup: true, courier: true, cdek: this.config.get("CDEK_ENABLED", { infer: true }) }; }
  async quote(dto: DeliveryQuoteDto) {
    const fingerprint = this.items(dto.items); let priceKopecks = 0; let meta: object | undefined;
    if (dto.method === "COURIER") priceKopecks = this.config.get("COURIER_PRICE_KOPECKS", { infer: true });
    if (dto.method === "CDEK") {
      if (!this.config.get("CDEK_ENABLED", { infer: true })) throw new BadRequestException("Доставка СДЭК временно недоступна");
      if (!dto.destinationCityCode) throw new BadRequestException("Укажите код города СДЭК");
      const variants = await this.prisma.productVariant.findMany({ where: { id: { in: dto.items.map((item) => item.variantId) } }, select: { id: true, weightG: true } });
      if (variants.length !== dto.items.length) throw new BadRequestException("Один из вариантов товара не найден");
      const weight = dto.items.reduce((sum, item) => sum + variants.find((variant) => variant.id === item.variantId)!.weightG * item.quantity, 0);
      const result = await this.cdek.quote(dto.destinationCityCode, weight); priceKopecks = result.priceKopecks; meta = result;
    }
    const payload: QuotePayload = { method: dto.method, items: fingerprint, priceKopecks, destinationCityCode: dto.destinationCityCode, meta, expiresAt: Date.now() + 15 * 60_000 };
    return { ...payload, token: this.sign(payload) };
  }
  verify(token: string | undefined, method: string, items: { variantId: string; quantity: number }[], destinationCityCode?: number) {
    if (!token) throw new BadRequestException("Получите актуальный расчёт доставки");
    const [encoded, signature] = token.split("."); const expected = this.signature(encoded ?? "");
    if (!encoded || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new BadRequestException("Расчёт доставки недействителен");
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as QuotePayload;
    if (payload.expiresAt < Date.now() || payload.method !== method || payload.items !== this.items(items) || payload.destinationCityCode !== destinationCityCode) throw new BadRequestException("Расчёт доставки устарел или не соответствует заказу");
    return payload;
  }
  private items(items: { variantId: string; quantity: number }[]) { return items.map((item) => `${item.variantId}:${item.quantity}`).sort().join("|"); }
  private sign(payload: QuotePayload) { const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${encoded}.${this.signature(encoded)}`; }
  private signature(value: string) { return createHmac("sha256", this.config.get("DELIVERY_QUOTE_SECRET", { infer: true })).update(value).digest("base64url"); }
}
