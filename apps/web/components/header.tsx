import Link from "next/link";
import { CartBadge } from "./cart";

export function Header() {
  return <header className="header">
    <Link className="logo" href="/" aria-label="ALGI GROUP — на главную"><span>ALGI</span> GROUP</Link>
    <nav aria-label="Основная навигация">
      <Link href="/catalog">Дрип-кофе</Link>
      <Link href="/brands">Бренды</Link>
      <Link href="/countries">Страны</Link>
      <Link href="/guide">Как заваривать</Link>
      <Link href="/cooperation">Для бизнеса</Link>
      <Link href="/contacts">Контакты</Link>
    </nav>
    <CartBadge/>
  </header>;
}
