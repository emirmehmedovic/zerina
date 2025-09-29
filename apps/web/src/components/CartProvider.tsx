"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string; // productId + optional variant suffix
  productId: string;
  variantId?: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  qty: number;
  image?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  clear: () => void;
  setQty: (id: string, qty: number) => void;
  totalCents: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // load from localStorage in client
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart:v1");
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        // Normalize legacy image paths to '/uploads/<file>' so StaticImage can render reliably
        const normalized = parsed.map((it) => {
          if (!it.image) return it;
          try {
            const fileName = it.image.split('/').pop() || it.image;
            return { ...it, image: `/uploads/${fileName}` };
          } catch {
            return it;
          }
        });
        setItems(normalized);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart:v1", JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartCtx["add"] = useCallback((item) => {
    const id = `${item.productId}${item.variantId ? `:${item.variantId}` : ""}`;
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + (item.qty || 1), priceCents: item.priceCents };
        return copy;
      }
      return [
        ...prev,
        {
          id,
          productId: item.productId,
          variantId: item.variantId,
          title: item.title,
          slug: item.slug,
          priceCents: item.priceCents,
          currency: item.currency,
          qty: item.qty || 1,
          image: item.image,
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const setQty = useCallback((id: string, qty: number) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p))), []);

  const totalCents = useMemo(() => items.reduce((sum, i) => sum + i.priceCents * i.qty, 0), [items]);

  const value: CartCtx = { items, add, remove, clear, setQty, totalCents };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
