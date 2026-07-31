"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/v1";
type View = "dashboard" | "products" | "orders" | "leads" | "operations";
type User = { id: string; email: string; displayName: string; role: string };
type Dashboard = { products: number; lowStock: number; newLeads: number; failedNotifications: number };
type Variant = { id: string; sku: string; weightG: number; grind: string; priceKopecks: number; stockQty: number; reservedQty: number; isActive: boolean };
type Product = { id: string; slug: string; name: string; status: string; brand: { name: string }; variants: Variant[] };
type Lead = { id: string; publicId: string; name: string; phone?: string; email?: string; audience: string; status: string; createdAt: string; notifications: { status: string }[] };
type Order = { id: string; publicId: string; customerName: string; customerPhone: string; status: string; totalKopecks: number; createdAt: string; items: unknown[] };
type AdminUser = { id: string; email: string; displayName: string; role: string; isActive: boolean };
type Audit = { id: string; action: string; entityType: string; entityId?: string; createdAt: string; actor?: { displayName: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(payload.message ?? `Ошибка ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const rubles = (kopecks: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(kopecks / 100);
const date = (value: string) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export function AdminApp() {
  const [user, setUser] = useState<User | null>();
  const [view, setView] = useState<View>("dashboard");
  const [error, setError] = useState("");

  useEffect(() => {
    request<User>("/admin/auth/me").then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="admin-loading">Загружаем админку…</div>;
  if (!user) return <AdminLogin onLogin={setUser} />;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">ALGI <span>CONTROL</span></div>
        <nav aria-label="Разделы админки">
          <AdminNav active={view === "dashboard"} onClick={() => setView("dashboard")}>Обзор</AdminNav>
          <AdminNav active={view === "products"} onClick={() => setView("products")}>Товары</AdminNav>
          <AdminNav active={view === "orders"} onClick={() => setView("orders")}>Заказы</AdminNav>
          <AdminNav active={view === "leads"} onClick={() => setView("leads")}>Лиды</AdminNav>
          {user.role === "ADMIN" && <AdminNav active={view === "operations"} onClick={() => setView("operations")}>Система</AdminNav>}
        </nav>
        <div className="admin-user"><b>{user.displayName}</b><span>{user.role} · {user.email}</span></div>
        <button className="admin-logout" onClick={() => request("/admin/auth/logout", { method: "POST" }).finally(() => setUser(null))}>Выйти</button>
      </aside>
      <section className="admin-workspace">
        {error && <div className="admin-alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {view === "dashboard" && <DashboardView onError={setError} />}
        {view === "products" && <ProductsView onError={setError} />}
        {view === "orders" && <OrdersView onError={setError} />}
        {view === "leads" && <LeadsView onError={setError} />}
        {view === "operations" && <OperationsView onError={setError} />}
      </section>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (user: User) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = new FormData(event.currentTarget);
    try {
      const result = await request<{ user: User }>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) });
      onLogin(result.user);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось войти"); }
    finally { setBusy(false); }
  }
  return <div className="admin-login"><form onSubmit={submit}><span className="eyebrow dark">Закрытый раздел</span><h1>Управление<br/>магазином</h1><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Пароль<input name="password" type="password" autoComplete="current-password" minLength={10} required/></label>{error && <p className="form-error">{error}</p>}<button className="button" disabled={busy}>{busy ? "Проверяем…" : "Войти"}</button></form><div className="admin-login-art"><div><b>ALGI</b><span>операционная панель</span></div></div></div>;
}

function AdminNav({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{children}</button>;
}

function DashboardView({ onError }: { onError: (value: string) => void }) {
  const [data, setData] = useState<Dashboard>();
  useEffect(() => { request<Dashboard>("/admin/dashboard").then(setData).catch((e: Error) => onError(e.message)); }, [onError]);
  return <><AdminHead title="Обзор" subtitle="Состояние магазина на текущий момент"/><div className="admin-metrics"><Metric label="Товаров" value={data?.products}/><Metric label="Заканчиваются" value={data?.lowStock} warn/><Metric label="Новых лидов" value={data?.newLeads}/><Metric label="Ошибок Telegram" value={data?.failedNotifications} warn/></div><div className="admin-panel"><h2>Контроль перед продажами</h2><ul><li>Заполните реквизиты и контакты в окружении production.</li><li>Проверьте обязательную маркировку каждой товарной позиции.</li><li>Подключите платёжного и кассового провайдера перед публикацией checkout.</li></ul></div></>;
}

function Metric({ label, value, warn }: { label: string; value?: number; warn?: boolean }) { return <article className={warn && value ? "warn" : ""}><span>{label}</span><b>{value ?? "—"}</b></article>; }

function ProductsView({ onError }: { onError: (value: string) => void }) {
  const [items, setItems] = useState<Product[]>([]);
  const load = useCallback(() => request<Product[]>("/admin/products").then(setItems).catch((e: Error) => onError(e.message)), [onError]);
  useEffect(() => { void load(); }, [load]);
  async function productStatus(item: Product, status: string) { try { await request(`/admin/products/${item.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { onError((e as Error).message); } }
  async function variantSave(variant: Variant, form: HTMLFormElement) { const values = new FormData(form); try { await request(`/admin/products/variants/${variant.id}`, { method: "PATCH", body: JSON.stringify({ priceKopecks: Number(values.get("price")) * 100, stockQty: Number(values.get("stock")) }) }); await load(); } catch (e) { onError((e as Error).message); } }
  return <><AdminHead title="Товары" subtitle={`${items.length} карточек, варианты и остатки`}/><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Товар</th><th>Статус</th><th>Вариант</th><th>Цена / остаток</th><th></th></tr></thead><tbody>{items.flatMap((item) => item.variants.length ? item.variants.map((variant, index) => <tr key={variant.id}><td>{index === 0 && <><b>{item.name}</b><span>{item.brand.name} · {item.slug}</span></>}</td><td>{index === 0 && <select value={item.status} onChange={(e) => productStatus(item, e.target.value)}><option>DRAFT</option><option>ACTIVE</option><option>ARCHIVED</option></select>}</td><td><b>{variant.weightG} г · {variant.grind}</b><span>{variant.sku} · резерв {variant.reservedQty}</span></td><td colSpan={2}><form className="admin-inline" onSubmit={(e) => { e.preventDefault(); void variantSave(variant, e.currentTarget); }}><input aria-label="Цена" name="price" type="number" min="0" defaultValue={variant.priceKopecks / 100}/><input aria-label="Остаток" name="stock" type="number" min="0" defaultValue={variant.stockQty}/><button>Сохранить</button></form></td></tr>) : [<tr key={item.id}><td><b>{item.name}</b></td><td>{item.status}</td><td colSpan={3}>Нет вариантов</td></tr>])}</tbody></table></div></>;
}

function OrdersView({ onError }: { onError: (value: string) => void }) {
  const [items, setItems] = useState<Order[]>([]);
  const load = useCallback(() => request<Order[]>("/admin/orders").then(setItems).catch((e: Error) => onError(e.message)), [onError]);
  useEffect(() => { void load(); }, [load]);
  async function setStatus(id: string, status: string) { try { await request(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { onError((e as Error).message); } }
  const transitions: Record<string, string[]> = { NEW: ["AWAITING_PAYMENT", "CANCELLED"], AWAITING_PAYMENT: ["PAID", "CANCELLED"], PAID: ["PROCESSING"], PROCESSING: ["SHIPPED"], SHIPPED: ["COMPLETED"] };
  return <><AdminHead title="Заказы" subtitle="Оплаты, сборка и доставка"/><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Номер</th><th>Клиент</th><th>Состав</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{item.publicId}</b><span>{date(item.createdAt)}</span></td><td><b>{item.customerName}</b><span>{item.customerPhone}</span></td><td>{item.items.length} поз.</td><td><b>{rubles(item.totalKopecks)}</b></td><td><select value={item.status} onChange={(e) => setStatus(item.id, e.target.value)}><option>{item.status}</option>{(transitions[item.status] ?? []).map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!items.length && <div className="admin-empty">Заказов пока нет</div>}</div></>;
}

function LeadsView({ onError }: { onError: (value: string) => void }) {
  const [items, setItems] = useState<Lead[]>([]);
  const load = useCallback(() => request<Lead[]>("/admin/leads").then(setItems).catch((e: Error) => onError(e.message)), [onError]);
  useEffect(() => { void load(); }, [load]);
  async function setStatus(id: string, status: string) { try { await request(`/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); } catch (e) { onError((e as Error).message); } }
  return <><AdminHead title="Лиды" subtitle="Заявки с сайта и доставка в Telegram"/><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Заявка</th><th>Контакт</th><th>Тип</th><th>Telegram</th><th>Статус</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><b>{item.publicId}</b><span>{date(item.createdAt)}</span></td><td><b>{item.name}</b><span>{item.phone ?? item.email ?? "—"}</span></td><td>{item.audience}</td><td>{item.notifications.at(0)?.status ?? "—"}</td><td><select value={item.status} onChange={(e) => setStatus(item.id, e.target.value)}>{["NEW","IN_PROGRESS","QUALIFIED","WON","LOST"].map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!items.length && <div className="admin-empty">Лидов пока нет</div>}</div></>;
}

function OperationsView({ onError }: { onError: (value: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]); const [audit, setAudit] = useState<Audit[]>([]);
  const load = useCallback(async () => { try { const [userRows, auditRows] = await Promise.all([request<AdminUser[]>("/admin/operations/users"), request<Audit[]>("/admin/operations/audit")]); setUsers(userRows); setAudit(auditRows); } catch (e) { onError((e as Error).message); } }, [onError]);
  useEffect(() => { void load(); }, [load]);
  async function updateUser(id: string, data: object) { try { await request(`/admin/operations/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }); await load(); } catch (e) { onError((e as Error).message); } }
  return <><AdminHead title="Система" subtitle="Сотрудники, роли и журнал действий"/><div className="admin-panel admin-system"><h2>Доступ сотрудников</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Доступ</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><b>{item.displayName}</b><span>{item.email}</span></td><td><select value={item.role} onChange={(e) => updateUser(item.id, { role: e.target.value })}>{["ADMIN","MANAGER","CONTENT_MANAGER","WAREHOUSE"].map((role) => <option key={role}>{role}</option>)}</select></td><td><button className="admin-switch" onClick={() => updateUser(item.id, { isActive: !item.isActive })}>{item.isActive ? "Активен" : "Отключён"}</button></td></tr>)}</tbody></table></div></div><div className="admin-panel admin-system"><h2>Последние действия</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Когда</th><th>Сотрудник</th><th>Действие</th><th>Объект</th></tr></thead><tbody>{audit.slice(0, 100).map((item) => <tr key={item.id}><td>{date(item.createdAt)}</td><td>{item.actor?.displayName ?? "Система"}</td><td><b>{item.action}</b></td><td>{item.entityType} {item.entityId?.slice(0, 8)}</td></tr>)}</tbody></table></div></div></>;
}

function AdminHead({ title, subtitle }: { title: string; subtitle: string }) { return <header className="admin-head"><div><span className="eyebrow dark">ALGI GROUP</span><h1>{title}</h1><p>{subtitle}</p></div><span className="admin-live">● система работает</span></header>; }
