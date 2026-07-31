import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnv } from "../config/env";

@Injectable()
export class CompanyService {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  getPublicDetails() {
    return {
      displayName: this.get("COMPANY_DISPLAY_NAME"),
      legalName: this.get("COMPANY_LEGAL_NAME"),
      inn: this.get("COMPANY_INN"),
      kpp: this.get("COMPANY_KPP"),
      ogrn: this.get("COMPANY_OGRN"),
      legalAddress: this.get("COMPANY_LEGAL_ADDRESS"),
      postalAddress: this.get("COMPANY_POSTAL_ADDRESS"),
      warehouseAddress: this.get("COMPANY_WAREHOUSE_ADDRESS"),
      email: this.get("COMPANY_EMAIL"),
      phone: this.get("COMPANY_PHONE"),
      telegramUrl: this.get("COMPANY_TELEGRAM_URL"),
      whatsappUrl: this.get("COMPANY_WHATSAPP_URL"),
      privacyContactEmail: this.get("PRIVACY_CONTACT_EMAIL") ?? this.get("COMPANY_EMAIL"),
    };
  }

  getInvoiceDetails() {
    return {
      ...this.getPublicDetails(),
      bankName: this.get("COMPANY_BANK_NAME"),
      bankBik: this.get("COMPANY_BANK_BIK"),
      bankCorrespondentAccount: this.get("COMPANY_BANK_CORRESPONDENT_ACCOUNT"),
      bankSettlementAccount: this.get("COMPANY_BANK_SETTLEMENT_ACCOUNT"),
      taxSystem: this.get("COMPANY_TAX_SYSTEM"),
      vatLabel: this.get("COMPANY_VAT_LABEL"),
    };
  }

  private get(key: keyof AppEnv): string | undefined {
    const value = this.config.get(key, { infer: true });
    return typeof value === "string" ? value : undefined;
  }
}
