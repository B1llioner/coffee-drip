export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";

export type Company = {
  displayName?: string;
  legalName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  postalAddress?: string;
  warehouseAddress?: string;
  email?: string;
  phone?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  privacyContactEmail?: string;
};

export type Variant = { id: string; sku: string; weightG: number; priceKopecks: number; price?: number; stockQty: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  flavorDescriptors: string[];
  roastLevel: string;
  isDecaf: boolean;
  images: string[];
  brand: { slug: string; name: string };
  countries: { slug: string; name: string }[];
  variants: Variant[];
  ingredients?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  productionCountry?: string;
  shelfLifeDays?: number;
  storageConditions?: string;
  preparation?: string;
  conformityDocument?: string;
};
export type Brand = { slug: string; name: string; tagline?: string; description?: string; roastLevel?: string; origins: string[]; productCount: number };
export type Country = { slug: string; name: string; region?: string; lead?: string; tasteNotes: string[]; aroma: string[]; altitude?: string; processing?: string; roastRecommendation?: string; productCount: number };

async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function getCompany(): Promise<Company> {
  return (await get<Company>("/storefront/company")) ?? {};
}

export async function getProducts(filters: { brand?: string; country?: string; roast?: string; decaf?: string; sort?: string } = {}): Promise<Product[]> {
  const query = new URLSearchParams({ limit: "48", ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
  const result = await get<{ items: Product[] }>(`/catalog/products?${query}`);
  return result?.items ?? [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  return get<Product>(`/catalog/products/${encodeURIComponent(slug)}`);
}

export async function getBrands(): Promise<Brand[]> { return (await get<Brand[]>("/catalog/brands")) ?? []; }
export async function getCountries(): Promise<Country[]> { return (await get<Country[]>("/catalog/countries")) ?? []; }

export function rubles(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value / 100);
}
