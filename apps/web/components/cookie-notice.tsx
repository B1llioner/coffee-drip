"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem("algi-cookie-notice") !== "necessary-v1"); }, []);
  if (!visible) return null;
  return <aside className="cookie-notice" aria-label="Уведомление о файлах cookie"><div><strong>Только необходимые данные</strong><p>Корзина хранится локально в браузере, а защищённая cookie используется для входа сотрудников. Рекламные и аналитические cookies сейчас выключены.</p><Link href="/legal/cookies">Подробнее</Link></div><button className="button" onClick={() => { localStorage.setItem("algi-cookie-notice", "necessary-v1"); setVisible(false); }}>Понятно</button></aside>;
}
