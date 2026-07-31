import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnv } from "../config/env";

@Injectable()
export class CdekProvider {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}
  async quote(destinationCode: number, weightG: number) {
    const token = await this.token();
    const response = await fetch("https://api.cdek.ru/v2/calculator/tarifflist", {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ type: 1, from_location: { code: this.config.get("CDEK_ORIGIN_CITY_CODE", { infer: true }) }, to_location: { code: destinationCode }, packages: [{ weight: weightG, length: 25, width: 18, height: 12 }] }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json() as { tariff_codes?: { tariff_code: number; tariff_name: string; delivery_sum: number; period_min: number; period_max: number }[]; errors?: { message: string }[] };
    if (!response.ok || !data.tariff_codes?.length) throw new Error(data.errors?.[0]?.message ?? "СДЭК не вернул доступные тарифы");
    const tariff = [...data.tariff_codes].sort((a, b) => a.delivery_sum - b.delivery_sum)[0];
    return { priceKopecks: Math.round(tariff.delivery_sum * 100), tariffCode: tariff.tariff_code, tariffName: tariff.tariff_name, daysMin: tariff.period_min, daysMax: tariff.period_max };
  }
  private async token() {
    const body = new URLSearchParams({ grant_type: "client_credentials", client_id: this.config.get("CDEK_CLIENT_ID", { infer: true })!, client_secret: this.config.get("CDEK_CLIENT_SECRET", { infer: true })! });
    const response = await fetch("https://api.cdek.ru/v2/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(7_000) });
    const data = await response.json() as { access_token?: string };
    if (!response.ok || !data.access_token) throw new Error("Не удалось авторизоваться в СДЭК");
    return data.access_token;
  }
}
