"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";
function CheckoutCompleteContent() {
  const order = useSearchParams().get("order");
  const [status, setStatus] = useState<string>("Проверяем оплату…");
  useEffect(() => {
    if (!order) { setStatus("Номер заказа не указан"); return; }
    let attempts = 0;
    const check = async () => {
      const response = await fetch(`${API}/orders/${encodeURIComponent(order)}`);
      const data = await response.json().catch(() => ({})) as { status?: string };
      if (data.status === "PAID" || data.status === "PROCESSING") setStatus("Оплата подтверждена");
      else if (data.status === "CANCELLED") setStatus("Оплата отменена");
      else if (attempts++ < 10) setTimeout(check, 2000);
      else setStatus("Платёж обрабатывается. Статус обновится в заказе.");
    };
    void check();
  }, [order]);
  return <section className="section order-done"><span className="eyebrow dark">Заказ {order ?? ""}</span><h1>{status}</h1><p>Мы не считаем возврат на сайт доказательством оплаты: сервер подтверждает платёж непосредственно через ЮKassa.</p><Link className="button" href="/">На главную</Link></section>;
}

export default function CheckoutComplete() {
  return <Suspense fallback={<section className="section order-done"><h1>Проверяем оплату…</h1></section>}><CheckoutCompleteContent/></Suspense>;
}
