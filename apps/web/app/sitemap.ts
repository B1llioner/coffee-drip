import type { MetadataRoute } from "next";
import { getProducts } from "../lib/api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
  const pages = ["", "/catalog", "/brands", "/countries", "/guide", "/cooperation", "/contacts", "/legal/privacy", "/legal/offer", "/legal/delivery", "/legal/returns"];
  const products = await getProducts();
  return [...pages.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "monthly" as const })), ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const }))];
}
