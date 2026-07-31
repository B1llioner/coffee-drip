import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { getCompany } from "../lib/api";
import { CartProvider } from "../components/cart";
import { CookieNotice } from "../components/cookie-notice";

export const metadata: Metadata = { metadataBase: new URL(process.env.PUBLIC_APP_URL ?? "http://localhost:3000"), title: { default: "ALGI GROUP — дрип-кофе", template: "%s — ALGI GROUP" }, description: "Свежий спешелти-кофе в удобных дрип-пакетах.", openGraph: { type: "website", locale: "ru_RU", title: "ALGI GROUP — дрип-кофе", description: "Свежий спешелти-кофе в удобных дрип-пакетах." } };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const company = await getCompany();
  return <html lang="ru"><body><CartProvider><Header/><main>{children}</main><Footer company={company}/><CookieNotice/></CartProvider></body></html>;
}
