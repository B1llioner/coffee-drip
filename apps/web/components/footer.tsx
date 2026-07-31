import Link from "next/link";
import type { Company } from "../lib/api";

export function Footer({ company }: { company: Company }) {
  return <footer className="footer">
    <div><div className="logo light"><span>ALGI</span> GROUP</div><p>Спешелти-кофе в дрип-пакетах.<br/>Свежая обжарка, одна чашка — где угодно.</p></div>
    <div><h3>Покупателям</h3><Link href="/catalog">Каталог</Link><Link href="/brands">Бренды</Link><Link href="/countries">Происхождение</Link><Link href="/guide">Как заваривать</Link><Link href="/legal/delivery">Доставка и оплата</Link><Link href="/legal/returns">Возврат</Link></div>
    <div><h3>Документы</h3><Link href="/legal/privacy">Политика ПДн</Link><Link href="/legal/consent">Согласие на ПДн</Link><Link href="/privacy-request">Запрос оператору</Link><Link href="/legal/cookies">Cookies</Link><Link href="/legal/offer">Публичная оферта</Link></div>
    <div><h3>Связаться</h3>{company.phone && <a href={`tel:${company.phone}`}>{company.phone}</a>}{company.email && <a href={`mailto:${company.email}`}>{company.email}</a>}<Link href="/contacts">Реквизиты</Link></div>
    <div className="footer-bottom"><span>© 2026 {company.legalName ?? "Продавец"}</span><span>ИНН {company.inn ?? "указывается после настройки"}</span></div>
  </footer>;
}
