import Link from "next/link";
import { getCountries } from "../../lib/api";

export const metadata = { title: "Страны происхождения кофе" };
export default async function CountriesPage() {
  const countries = await getCountries();
  return <><section className="page-hero origin-hero"><span className="eyebrow">Терруар</span><h1>Происхождение</h1><p>Высота, климат и обработка формируют вкус ещё до обжарки. Показываем, откуда приходит зерно.</p></section><section className="section origin-grid">{countries.map((country) => <article className="origin-card" key={country.slug}><div><span className="eyebrow dark">{country.region}</span><h2>{country.name}</h2><p className="lead">{country.lead}</p></div><dl><div><dt>Высота</dt><dd>{country.altitude ?? "—"}</dd></div><div><dt>Обработка</dt><dd>{country.processing ?? "—"}</dd></div><div><dt>Обжарка</dt><dd>{country.roastRecommendation ?? "—"}</dd></div></dl><div className="tag-row">{country.tasteNotes.map((note) => <span key={note}>{note}</span>)}</div><Link className="text-link" href={`/catalog?country=${country.slug}`}>{country.productCount} товаров →</Link></article>)}</section></>;
}
