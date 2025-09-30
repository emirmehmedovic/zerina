"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import StaticImage from "@/components/StaticImage";

type Product = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
};

export default function CategoriesClient({
  slug,
  initialItems,
  total,
  initialTake = 12,
}: {
  slug: string;
  initialItems: Product[];
  total: number;
  initialTake?: number;
}) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [take] = useState(Math.max(1, Math.min(60, initialTake)));
  const [skip, setSkip] = useState(initialItems.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(initialItems.length >= total);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canLoad = useMemo(() => !loadingMore && !done && items.length < total, [loadingMore, done, items.length, total]);

  const loadMore = async () => {
    if (!canLoad) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/categories/${slug}/products?take=${take}&skip=${skip}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const next: Product[] = Array.isArray(data.items) ? data.items : [];
        setItems((prev) => [...prev, ...next]);
        setSkip((s) => s + next.length);
        if ((items.length + next.length) >= (data.total ?? total)) {
          setDone(true);
        }
      }
    } catch {}
    finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        loadMore();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, canLoad, skip, take, slug]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <article key={p.id} className="card-base card-glass card-hover p-4">
            {p.images && p.images.length > 0 ? (
              <StaticImage fileName={p.images[0].storageKey} alt={p.title} className="h-40 w-full object-cover rounded-md mb-3" />
            ) : (
              <div className="h-40 bg-light-muted/10 dark:bg-dark-muted/10 rounded-md mb-3"/>
            )}
            <h3 className="font-semibold mb-1">{p.title}</h3>
            <p className="text-light-muted dark:text-dark-muted text-sm">{(p.priceCents/100).toFixed(2)} {p.currency}</p>
            <a className="btn-primary inline-block mt-3" href={`/products/${p.slug}`}>View product</a>
          </article>
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-sm text-light-muted dark:text-dark-muted">
        {loadingMore ? "Loading…" : done ? "" : ""}
      </div>
    </>
  );
}
