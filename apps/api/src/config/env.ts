export type AppEnv = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  PUBLIC_APP_URL: string;
  ADMIN_APP_URL: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_LEADS_CHAT_ID?: string;
  TELEGRAM_INCLUDE_PERSONAL_DATA: boolean;
  LEAD_RETENTION_DAYS: number;
  IP_HASH_SECRET: string;
  TRUST_PROXY: boolean;
  ORDER_RESERVATION_MINUTES: number;
  COMPANY_DISPLAY_NAME?: string;
  COMPANY_LEGAL_NAME?: string;
  COMPANY_INN?: string;
  COMPANY_KPP?: string;
  COMPANY_OGRN?: string;
  COMPANY_LEGAL_ADDRESS?: string;
  COMPANY_POSTAL_ADDRESS?: string;
  COMPANY_WAREHOUSE_ADDRESS?: string;
  COMPANY_EMAIL?: string;
  COMPANY_PHONE?: string;
  COMPANY_TELEGRAM_URL?: string;
  COMPANY_WHATSAPP_URL?: string;
  COMPANY_BANK_NAME?: string;
  COMPANY_BANK_BIK?: string;
  COMPANY_BANK_CORRESPONDENT_ACCOUNT?: string;
  COMPANY_BANK_SETTLEMENT_ACCOUNT?: string;
  COMPANY_TAX_SYSTEM?: string;
  COMPANY_VAT_LABEL?: string;
  PRIVACY_CONTACT_EMAIL?: string;
  ADMIN_BOOTSTRAP_EMAIL?: string;
  ADMIN_BOOTSTRAP_PASSWORD?: string;
  ADMIN_BOOTSTRAP_NAME: string;
  ADMIN_SESSION_HOURS: number;
  PAYMENT_PROVIDER: "manual" | "yookassa";
  YOOKASSA_SHOP_ID?: string;
  YOOKASSA_SECRET_KEY?: string;
  YOOKASSA_RETURN_URL: string;
  YOOKASSA_VAT_CODE?: number;
  MARKING_ENCRYPTION_KEY?: string;
  LEGAL_DOCUMENTS_APPROVED: boolean;
  RKN_NOTIFICATION_CONFIRMED: boolean;
  DATA_LOCALIZATION_CONFIRMED: boolean;
  MARKING_READINESS_CONFIRMED: boolean;
  ALLOW_MANUAL_PAYMENT_IN_PRODUCTION: boolean;
  DELIVERY_QUOTE_SECRET: string;
  COURIER_PRICE_KOPECKS: number;
  CDEK_ENABLED: boolean;
  CDEK_CLIENT_ID?: string;
  CDEK_CLIENT_SECRET?: string;
  CDEK_ORIGIN_CITY_CODE?: number;
};

const COMPANY_KEYS = [
  "COMPANY_LEGAL_NAME",
  "COMPANY_INN",
  "COMPANY_OGRN",
  "COMPANY_LEGAL_ADDRESS",
  "COMPANY_EMAIL",
  "COMPANY_PHONE",
] as const;

function boolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Expected positive integer, received ${String(value)}`);
  return parsed;
}

function optionalString(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function assertCompanyEnv(raw: Record<string, unknown>, nodeEnv: AppEnv["NODE_ENV"]): void {
  if (nodeEnv === "production") {
    const missing = COMPANY_KEYS.filter((key) => !optionalString(raw[key]));
    if (missing.length) throw new Error(`Missing required company environment variables: ${missing.join(", ")}`);
  }
  const deliverySecret = String(raw.DELIVERY_QUOTE_SECRET ?? raw.IP_HASH_SECRET);
  if (deliverySecret.length < 32) throw new Error("DELIVERY_QUOTE_SECRET must contain at least 32 characters");
  const cdekEnabled = boolean(raw.CDEK_ENABLED);
  const cdekClientId = optionalString(raw.CDEK_CLIENT_ID); const cdekClientSecret = optionalString(raw.CDEK_CLIENT_SECRET);
  const cdekOrigin = optionalString(raw.CDEK_ORIGIN_CITY_CODE) ? Number(raw.CDEK_ORIGIN_CITY_CODE) : undefined;
  if (cdekEnabled && (!cdekClientId || !cdekClientSecret || !cdekOrigin)) throw new Error("CDEK credentials and origin city code are required when CDEK_ENABLED=true");

  const inn = optionalString(raw.COMPANY_INN);
  const kpp = optionalString(raw.COMPANY_KPP);
  const ogrn = optionalString(raw.COMPANY_OGRN);
  const bik = optionalString(raw.COMPANY_BANK_BIK);
  const settlementAccount = optionalString(raw.COMPANY_BANK_SETTLEMENT_ACCOUNT);
  const correspondentAccount = optionalString(raw.COMPANY_BANK_CORRESPONDENT_ACCOUNT);

  if (inn && !/^(\d{10}|\d{12})$/.test(inn)) throw new Error("COMPANY_INN must contain 10 or 12 digits");
  if (kpp && !/^\d{9}$/.test(kpp)) throw new Error("COMPANY_KPP must contain 9 digits");
  if (ogrn && !/^(\d{13}|\d{15})$/.test(ogrn)) throw new Error("COMPANY_OGRN must contain 13 or 15 digits");
  if (bik && !/^\d{9}$/.test(bik)) throw new Error("COMPANY_BANK_BIK must contain 9 digits");
  if (settlementAccount && !/^\d{20}$/.test(settlementAccount)) {
    throw new Error("COMPANY_BANK_SETTLEMENT_ACCOUNT must contain 20 digits");
  }
  if (correspondentAccount && !/^\d{20}$/.test(correspondentAccount)) {
    throw new Error("COMPANY_BANK_CORRESPONDENT_ACCOUNT must contain 20 digits");
  }
}

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const nodeEnv = String(raw.NODE_ENV ?? "development") as AppEnv["NODE_ENV"];
  if (!["development", "test", "production"].includes(nodeEnv)) throw new Error("NODE_ENV is invalid");
  if (!raw.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!raw.IP_HASH_SECRET || String(raw.IP_HASH_SECRET).length < 32) {
    throw new Error("IP_HASH_SECRET must contain at least 32 characters");
  }
  assertCompanyEnv(raw, nodeEnv);
  const bootstrapEmail = optionalString(raw.ADMIN_BOOTSTRAP_EMAIL);
  const bootstrapPassword = optionalString(raw.ADMIN_BOOTSTRAP_PASSWORD);
  if (Boolean(bootstrapEmail) !== Boolean(bootstrapPassword)) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be set together");
  }
  if (bootstrapPassword && bootstrapPassword.length < (nodeEnv === "production" ? 16 : 10)) {
    throw new Error(`ADMIN_BOOTSTRAP_PASSWORD must contain at least ${nodeEnv === "production" ? 16 : 10} characters`);
  }
  const paymentProvider = String(raw.PAYMENT_PROVIDER ?? "manual");
  if (!(["manual", "yookassa"] as const).includes(paymentProvider as "manual" | "yookassa")) {
    throw new Error("PAYMENT_PROVIDER must be manual or yookassa");
  }
  const yooShopId = optionalString(raw.YOOKASSA_SHOP_ID);
  const yooSecret = optionalString(raw.YOOKASSA_SECRET_KEY);
  const yooVatRaw = optionalString(raw.YOOKASSA_VAT_CODE);
  const yooVat = yooVatRaw ? Number(yooVatRaw) : undefined;
  if (paymentProvider === "yookassa" && (!yooShopId || !yooSecret || !yooVat)) {
    throw new Error("YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY and YOOKASSA_VAT_CODE are required for yookassa");
  }
  if (yooVat !== undefined && (!Number.isInteger(yooVat) || yooVat < 1 || yooVat > 12)) {
    throw new Error("YOOKASSA_VAT_CODE must be an integer from 1 to 12");
  }
  const markingKey = optionalString(raw.MARKING_ENCRYPTION_KEY);
  if (markingKey && !/^[a-fA-F0-9]{64}$/.test(markingKey)) throw new Error("MARKING_ENCRYPTION_KEY must contain 64 hexadecimal characters");
  const deliverySecret = String(raw.DELIVERY_QUOTE_SECRET ?? raw.IP_HASH_SECRET);
  if (deliverySecret.length < 32) throw new Error("DELIVERY_QUOTE_SECRET must contain at least 32 characters");
  const cdekEnabled = boolean(raw.CDEK_ENABLED);
  const cdekClientId = optionalString(raw.CDEK_CLIENT_ID);
  const cdekClientSecret = optionalString(raw.CDEK_CLIENT_SECRET);
  const cdekOrigin = optionalString(raw.CDEK_ORIGIN_CITY_CODE) ? Number(raw.CDEK_ORIGIN_CITY_CODE) : undefined;
  if (cdekEnabled && (!cdekClientId || !cdekClientSecret || !cdekOrigin)) throw new Error("CDEK credentials and origin city code are required when CDEK_ENABLED=true");
  if (nodeEnv === "production") {
    const gates = ["LEGAL_DOCUMENTS_APPROVED", "RKN_NOTIFICATION_CONFIRMED", "DATA_LOCALIZATION_CONFIRMED", "MARKING_READINESS_CONFIRMED"] as const;
    const missingGates = gates.filter((key) => !boolean(raw[key]));
    if (missingGates.length) throw new Error(`Production compliance gates are not confirmed: ${missingGates.join(", ")}`);
    if (!markingKey) throw new Error("MARKING_ENCRYPTION_KEY is required in production");
    if (paymentProvider === "manual" && !boolean(raw.ALLOW_MANUAL_PAYMENT_IN_PRODUCTION)) {
      throw new Error("Manual payments are disabled in production; configure yookassa or explicitly allow manual payments");
    }
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: positiveInt(raw.PORT, 4000),
    DATABASE_URL: String(raw.DATABASE_URL),
    PUBLIC_APP_URL: String(raw.PUBLIC_APP_URL ?? "http://localhost:3000"),
    ADMIN_APP_URL: String(raw.ADMIN_APP_URL ?? "http://localhost:3000/admin"),
    TELEGRAM_BOT_TOKEN: raw.TELEGRAM_BOT_TOKEN ? String(raw.TELEGRAM_BOT_TOKEN) : undefined,
    TELEGRAM_LEADS_CHAT_ID: raw.TELEGRAM_LEADS_CHAT_ID ? String(raw.TELEGRAM_LEADS_CHAT_ID) : undefined,
    TELEGRAM_INCLUDE_PERSONAL_DATA: boolean(raw.TELEGRAM_INCLUDE_PERSONAL_DATA),
    LEAD_RETENTION_DAYS: positiveInt(raw.LEAD_RETENTION_DAYS, 365),
    IP_HASH_SECRET: String(raw.IP_HASH_SECRET),
    TRUST_PROXY: boolean(raw.TRUST_PROXY),
    ORDER_RESERVATION_MINUTES: positiveInt(raw.ORDER_RESERVATION_MINUTES, 30),
    COMPANY_DISPLAY_NAME: optionalString(raw.COMPANY_DISPLAY_NAME),
    COMPANY_LEGAL_NAME: optionalString(raw.COMPANY_LEGAL_NAME),
    COMPANY_INN: optionalString(raw.COMPANY_INN),
    COMPANY_KPP: optionalString(raw.COMPANY_KPP),
    COMPANY_OGRN: optionalString(raw.COMPANY_OGRN),
    COMPANY_LEGAL_ADDRESS: optionalString(raw.COMPANY_LEGAL_ADDRESS),
    COMPANY_POSTAL_ADDRESS: optionalString(raw.COMPANY_POSTAL_ADDRESS),
    COMPANY_WAREHOUSE_ADDRESS: optionalString(raw.COMPANY_WAREHOUSE_ADDRESS),
    COMPANY_EMAIL: optionalString(raw.COMPANY_EMAIL),
    COMPANY_PHONE: optionalString(raw.COMPANY_PHONE),
    COMPANY_TELEGRAM_URL: optionalString(raw.COMPANY_TELEGRAM_URL),
    COMPANY_WHATSAPP_URL: optionalString(raw.COMPANY_WHATSAPP_URL),
    COMPANY_BANK_NAME: optionalString(raw.COMPANY_BANK_NAME),
    COMPANY_BANK_BIK: optionalString(raw.COMPANY_BANK_BIK),
    COMPANY_BANK_CORRESPONDENT_ACCOUNT: optionalString(raw.COMPANY_BANK_CORRESPONDENT_ACCOUNT),
    COMPANY_BANK_SETTLEMENT_ACCOUNT: optionalString(raw.COMPANY_BANK_SETTLEMENT_ACCOUNT),
    COMPANY_TAX_SYSTEM: optionalString(raw.COMPANY_TAX_SYSTEM),
    COMPANY_VAT_LABEL: optionalString(raw.COMPANY_VAT_LABEL),
    PRIVACY_CONTACT_EMAIL: optionalString(raw.PRIVACY_CONTACT_EMAIL),
    ADMIN_BOOTSTRAP_EMAIL: bootstrapEmail?.toLowerCase(),
    ADMIN_BOOTSTRAP_PASSWORD: bootstrapPassword,
    ADMIN_BOOTSTRAP_NAME: optionalString(raw.ADMIN_BOOTSTRAP_NAME) ?? "Администратор",
    ADMIN_SESSION_HOURS: positiveInt(raw.ADMIN_SESSION_HOURS, 12),
    PAYMENT_PROVIDER: paymentProvider as AppEnv["PAYMENT_PROVIDER"],
    YOOKASSA_SHOP_ID: yooShopId,
    YOOKASSA_SECRET_KEY: yooSecret,
    YOOKASSA_RETURN_URL: String(raw.YOOKASSA_RETURN_URL ?? `${raw.PUBLIC_APP_URL ?? "http://localhost:3000"}/checkout/complete`),
    YOOKASSA_VAT_CODE: yooVat,
    MARKING_ENCRYPTION_KEY: markingKey,
    LEGAL_DOCUMENTS_APPROVED: boolean(raw.LEGAL_DOCUMENTS_APPROVED),
    RKN_NOTIFICATION_CONFIRMED: boolean(raw.RKN_NOTIFICATION_CONFIRMED),
    DATA_LOCALIZATION_CONFIRMED: boolean(raw.DATA_LOCALIZATION_CONFIRMED),
    MARKING_READINESS_CONFIRMED: boolean(raw.MARKING_READINESS_CONFIRMED),
    ALLOW_MANUAL_PAYMENT_IN_PRODUCTION: boolean(raw.ALLOW_MANUAL_PAYMENT_IN_PRODUCTION),
    DELIVERY_QUOTE_SECRET: deliverySecret,
    COURIER_PRICE_KOPECKS: positiveInt(raw.COURIER_PRICE_KOPECKS, 49_000),
    CDEK_ENABLED: cdekEnabled,
    CDEK_CLIENT_ID: cdekClientId,
    CDEK_CLIENT_SECRET: cdekClientSecret,
    CDEK_ORIGIN_CITY_CODE: cdekOrigin,
  };
}
