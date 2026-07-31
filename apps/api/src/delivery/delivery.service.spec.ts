import { describe, expect, it } from "vitest";
import { DeliveryService } from "./delivery.service";

const config = { get(key: string) { return { DELIVERY_QUOTE_SECRET: "test-delivery-secret-at-least-32-characters", COURIER_PRICE_KOPECKS: 49_000, CDEK_ENABLED: false }[key]; } };
const service = new DeliveryService({} as never, config as never, {} as never);
const items = [{ variantId: "8eaf8b82-08b9-49df-b154-2af243917951", quantity: 2 }];

describe("delivery quote signing", () => {
  it("signs and verifies a courier quote bound to exact cart", async () => {
    const quote = await service.quote({ method: "COURIER", items });
    expect(service.verify(quote.token, "COURIER", items).priceKopecks).toBe(49_000);
    expect(() => service.verify(quote.token, "COURIER", [{ ...items[0], quantity: 3 }])).toThrow(/не соответствует/);
  });
  it("rejects a modified quote", async () => {
    const quote = await service.quote({ method: "PICKUP", items });
    expect(() => service.verify(`${quote.token}x`, "PICKUP", items)).toThrow(/недействителен/);
  });
});
