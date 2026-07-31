export type PaymentOrder = {
  id: string;
  publicId: string;
  totalKopecks: number;
  deliveryKopecks: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  items: { productName: string; quantity: number; unitPriceKopecks: number }[];
};

export type ProviderPayment = { externalId?: string; status: "PENDING" | "SUCCEEDED" | "FAILED"; confirmationUrl?: string; raw?: object };

export interface PaymentProvider {
  create(order: PaymentOrder, idempotencyKey: string): Promise<ProviderPayment>;
  verify(externalId: string): Promise<{ status: "PENDING" | "SUCCEEDED" | "FAILED"; amountKopecks: number; raw: object }>;
}
