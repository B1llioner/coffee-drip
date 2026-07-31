"use client";

import { FormEvent, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";

export default function PrivacyRequestPage() {
  const [result, setResult] = useState<string>(); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").replace(/[^\d+]/g, "").replace(/^8/, "+7").replace(/^7/, "+7");
    const payload = { type: form.get("type"), name: form.get("name"), email: form.get("email") || undefined, phone: phone || undefined, details: form.get("details") || undefined };
    const response = await fetch(`${API}/privacy/requests`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !data.id) { setError(data.message ?? "Не удалось отправить запрос"); return; }
    setResult(data.id);
  }
  if (result) return <section className="section legal"><span className="eyebrow dark">Запрос принят</span><h1>{result}</h1><p>Для защиты данных оператор сначала проверит личность заявителя и затем ответит по указанному контакту.</p></section>;
  return <><section className="page-hero"><span className="eyebrow">Персональные данные</span><h1>Запрос оператору</h1><p>Доступ, уточнение, удаление, ограничение обработки или отзыв согласия.</p></section><section className="section contact-strip"><div><h2>Как проходит запрос</h2><p>Укажите контакт, который использовали на сайте. Перед раскрытием или удалением данных мы запросим подтверждение личности, чтобы не передать сведения постороннему.</p></div><form className="lead-form" onSubmit={submit}><label>Тип запроса<select name="type"><option value="ACCESS">Получить сведения</option><option value="CORRECTION">Исправить данные</option><option value="DELETION">Удалить данные</option><option value="RESTRICTION">Ограничить обработку</option><option value="CONSENT_WITHDRAWAL">Отозвать согласие</option></select></label><label>Имя<input name="name" required minLength={2}/></label><div className="form-grid"><label>Email<input name="email" type="email"/></label><label>Телефон<input name="phone" inputMode="tel"/></label></div><label>Подробности<textarea name="details" rows={5}/></label><p className="micro">Согласие для этого запроса не требуется: обработка необходима для исполнения обязанностей оператора и защиты ваших прав.</p><button className="button">Отправить запрос</button>{error && <p className="form-error">{error}</p>}</form></section></>;
}
