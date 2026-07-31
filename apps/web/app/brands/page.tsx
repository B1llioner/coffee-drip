import Link from "next/link";
import { getBrands } from "../../lib/api";

export const metadata = { title: "Бренды кофе" };
export default async function BrandsPage() {
  const brands = await getBrands();
  return <><section className="page-hero"><span className="eyebrow">Коллекции</span><h1>Бренды</h1><p>Разные характеры обжарки — от плотной итальянской классики до современной фруктовой чашки.</p></section><section className="section editorial-grid">{brands.map((brand, index) => <article className="editorial-card" key={brand.slug}><span className="editorial-index">{String(index + 1).padStart(2, "0")}</span><span className="eyebrow dark">{brand.roastLevel ?? "Собственный профиль"}</span><h2>{brand.name}</h2><p className="lead">{brand.tagline}</p><p>{brand.description}</p><div className="tag-row">{brand.origins.map((origin) => <span key={origin}>{origin}</span>)}</div><Link className="text-link" href={`/catalog?brand=${brand.slug}`}>{brand.productCount} товаров →</Link></article>)}</section></>;
}
