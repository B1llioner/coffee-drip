"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";

export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [consentVersion, setConsentVersion] = useState<string>();
  useEffect(() => { fetch(`${API}/consents/lead-response`).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { version: string }) => setConsentVersion(data.version)).catch(() => setState("error")); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    try {
      const phone = String(payload.phone ?? "").replace(/[^\d+]/g, "").replace(/^8/, "+7").replace(/^7/, "+7");
      const response = await fetch(`${API}/leads`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, phone, audience: payload.audience || "HOME", sourcePage: location.pathname, consentAccepted: true, consentVersion }),
      });
      if (!response.ok) throw new Error();
      setState("done"); event.currentTarget.reset();
    } catch { setState("error"); }
  }
  if (state === "done") return <div className="form-success" role="status"><strong>Спасибо!</strong><span>Обращение принято. Мы скоро свяжемся с вами.</span></div>;
  return <form className={compact ? "lead-form compact" : "lead-form"} onSubmit={submit}>
    <div className="form-grid"><label>Имя<input name="name" required minLength={2} placeholder="Как к вам обращаться" /></label><label>Телефон<input name="phone" required inputMode="tel" placeholder="+7 999 000-00-00" /></label></div>
    {!compact && <><label>Кому нужен кофе<select name="audience" defaultValue="HOME"><option value="HOME">Для дома</option><option value="CAFE">Для кофейни</option><option value="RESTAURANT">Для ресторана</option><option value="WHOLESALE">Оптовая закупка</option><option value="PRIVATE_LABEL">Свой бренд</option></select></label><label>Комментарий<textarea name="message" rows={3} placeholder="Расскажите о задаче" /></label></>}
    <input name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />
    <label className="consent"><input type="checkbox" required /> <span>Я даю отдельное <a href="/legal/consent" target="_blank">согласие на обработку персональных данных</a> для ответа на обращение. Без рекламной рассылки.</span></label>
    <button className="button" disabled={state === "sending" || !consentVersion}>{state === "sending" ? "Отправляем…" : !consentVersion ? "Загружаем согласие…" : "Отправить заявку"}</button>
    {state === "error" && <p className="form-error" role="alert">Не удалось отправить. Проверьте номер или напишите нам по email.</p>}
  </form>;
}
