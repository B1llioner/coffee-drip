"use client";

import Link from "next/link";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { variantId: string; slug: string; name: string; priceKopecks: number; quantity: number };
type CartContextValue = { lines: CartLine[]; add: (line: Omit<CartLine, "quantity">) => void; setQuantity: (id: string, q: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem("algi-cart") ?? "[]")); } catch {} }, []);
  useEffect(() => { localStorage.setItem("algi-cart", JSON.stringify(lines)); }, [lines]);
  const value = useMemo<CartContextValue>(() => ({
    lines,
    add: line => setLines(current => { const existing = current.find(i => i.variantId === line.variantId); return existing ? current.map(i => i.variantId === line.variantId ? { ...i, quantity: i.quantity + 1 } : i) : [...current, { ...line, quantity: 1 }]; }),
    setQuantity: (id, quantity) => setLines(current => quantity <= 0 ? current.filter(i => i.variantId !== id) : current.map(i => i.variantId === id ? { ...i, quantity: Math.min(quantity, 99) } : i)),
    clear: () => setLines([]),
  }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("CartProvider is missing"); return value; }
export function CartBadge() { const { lines } = useCart(); const count = lines.reduce((sum, line) => sum + line.quantity, 0); return <Link className="header-cart" href="/checkout">Корзина <span>{count ? `(${count})` : "→"}</span></Link>; }
export function AddToCart({ variantId, slug, name, priceKopecks }: Omit<CartLine, "quantity">) { const { add } = useCart(); const [added, setAdded] = useState(false); return <button className="button" onClick={() => { add({ variantId, slug, name, priceKopecks }); setAdded(true); }}>{added ? "В корзине ✓" : "Добавить в корзину"}</button>; }
