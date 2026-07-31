import Link from "next/link";
import { getProducts, rubles } from "../../lib/api";

export const metadata = { title: "Каталог дрип-кофе" };
export default async function Catalog({ searchParams }: { searchParams: Promise<{ brand?: string; country?: string; roast?: string; decaf?: string; sort?: string }> }) {
  const filters = await searchParams; const products = await getProducts(filters);
  const active = [filters.brand, filters.country, filters.roast, filters.decaf === "true" ? "без кофеина" : undefined].filter(Boolean);
  return <><section className="page-hero"><span className="eyebrow">Коллекция ALGI</span><h1>Дрип-кофе</h1><p>Каждая коробка — набор одинаково точных чашек. Выберите профиль от шоколадного до цветочного.</p></section><section className="section"><div className="catalog-toolbar"><span>{products.length} вкусов {active.length ? `· ${active.join(" · ")}` : ""}</span><span><Link href="/catalog">Сбросить фильтры</Link> · <Link href="/catalog?decaf=true">Decaf</Link></span></div><div className="product-grid catalog-grid">{products.map((p, i) => <Link className="product-card" href={`/product/${p.slug}`} key={p.id}><span className="product-number">{String(i + 1).padStart(2, "0")}</span><div className={`packet tone-${i % 3}`}><span>ALGI</span><b>{p.name}</b><small>DRIP COFFEE · 10 G</small></div><div><span className="brand">{p.brand.name} · {p.countries.map(c => c.name).join(", ")}</span><h3>{p.name}</h3><p>{p.flavorDescriptors.join(" · ")}</p><strong>{p.variants[0] ? rubles(p.variants[0].priceKopecks) : "Нет в наличии"}</strong></div></Link>)}</div>{!products.length && <div className="empty"><h2>По фильтру ничего не найдено</h2><p>Сбросьте фильтры или проверьте доступность API.</p></div>}</section></>;
}
