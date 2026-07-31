import { afterEach, describe, expect, it, vi } from "vitest";
import { YooKassaProvider } from "./yookassa.provider";

const config = { get(key: string) { return { YOOKASSA_SHOP_ID: "shop", YOOKASSA_SECRET_KEY: "secret", YOOKASSA_VAT_CODE: 1, YOOKASSA_RETURN_URL: "https://coffee.example/checkout/complete" }[key]; } };
afterEach(() => vi.unstubAllGlobals());

describe("YooKassa provider", () => {
  it("sends idempotent payment with receipt and return order number", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect((init.headers as Record<string, string>)["Idempotence-Key"]).toBe("pay-key");
      expect(body.receipt.items[0].payment_subject).toBe("commodity");
      expect(body.confirmation.return_url).toContain("order=OR-1");
      return new Response(JSON.stringify({ id: "payment-1", status: "pending", amount: { value: "10.00" }, confirmation: { confirmation_url: "https://pay.example" } }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new YooKassaProvider(config as never);
    const result = await provider.create({ id: "id", publicId: "OR-1", totalKopecks: 1000, deliveryKopecks: 0, customerName: "Тест", customerPhone: "+79990000000", customerEmail: null, items: [{ productName: "Кофе", quantity: 1, unitPriceKopecks: 1000 }] }, "pay-key");
    expect(result).toMatchObject({ externalId: "payment-1", status: "PENDING", confirmationUrl: "https://pay.example" });
  });
});
