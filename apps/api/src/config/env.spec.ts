import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const base = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://localhost/test",
  IP_HASH_SECRET: "test-secret-with-at-least-32-characters",
};

describe("validateEnv company details", () => {
  it("allows empty company details in development", () => {
    expect(validateEnv(base).COMPANY_LEGAL_NAME).toBeUndefined();
  });

  it("requires seller identity and contacts in production", () => {
    expect(() => validateEnv({ ...base, NODE_ENV: "production" })).toThrow(
      /Missing required company environment variables/,
    );
  });

  it("validates Russian registration and bank number formats", () => {
    expect(() => validateEnv({ ...base, COMPANY_INN: "123" })).toThrow(/COMPANY_INN/);
    expect(() => validateEnv({ ...base, COMPANY_OGRN: "123" })).toThrow(/COMPANY_OGRN/);
    expect(() => validateEnv({ ...base, COMPANY_BANK_SETTLEMENT_ACCOUNT: "123" })).toThrow(
      /COMPANY_BANK_SETTLEMENT_ACCOUNT/,
    );
  });

  it("normalizes blank values and whitespace", () => {
    const env = validateEnv({
      ...base,
      COMPANY_LEGAL_NAME: "  ООО Тест  ",
      COMPANY_KPP: "   ",
    });

    expect(env.COMPANY_LEGAL_NAME).toBe("ООО Тест");
    expect(env.COMPANY_KPP).toBeUndefined();
  });

  it("requires explicit compliance gates in production", () => {
    const company = { COMPANY_LEGAL_NAME: "ООО Тест", COMPANY_INN: "7707083893", COMPANY_OGRN: "1027700132195", COMPANY_LEGAL_ADDRESS: "Москва", COMPANY_EMAIL: "legal@example.ru", COMPANY_PHONE: "+74950000000" };
    expect(() => validateEnv({ ...base, ...company, NODE_ENV: "production" })).toThrow(/Production compliance gates/);
  });
});
