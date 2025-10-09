"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { API_URL } from "@/lib/api";
import { createPortal } from "react-dom";
import { imageUrl } from "@/lib/imageUrl";

export default function SearchBar({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; slug: string; priceCents: number; currency: string; image?: string | null }>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const initial = params?.get("query") || params?.get("q") || "";
    setQ(initial);
  }, [params]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    const url = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
    router.push(url);
    setOpen(false);
  };

  // Debounced suggestions fetch
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/products?q=${encodeURIComponent(query)}&take=5&noCount=1`, { cache: 'no-store' });
        const body = await res.json().catch(() => ({}));
        const items = Array.isArray(body?.items) ? body.items : [];
        setSuggestions(items.map((p: any) => ({ 
          id: p.id, 
          title: p.title, 
          slug: p.slug, 
          priceCents: p.priceCents, 
          currency: p.currency,
          image: p.images?.[0]?.storageKey ?? null,
        })));
        setOpen(items.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250) as unknown as number;
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [q]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // Track anchor rect for portal dropdown positioning
  useEffect(() => {
    const updateRect = () => {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      setAnchorRect({ left: r.left, top: r.bottom, width: r.width, height: r.height });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open, q]);

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`} role="search" ref={containerRef}>
      <div
        className="flex items-center h-9 rounded-full bg-white/20 hover:bg-white/30 text-amber-900 border border-amber-900 focus-within:border-amber-900 focus-within:ring-2 focus-within:ring-amber-900 transition px-3 gap-2"
        style={{ backdropFilter: "blur(8px)" }}
        ref={anchorRef}
      >
        <button type="submit" aria-label="Search" className="p-0.5 -ml-0.5 hover:opacity-80">
          <Search className="h-4 w-4 flex-shrink-0 text-amber-900" />
        </button>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && activeIndex >= 0) {
              e.preventDefault();
              const sel = suggestions[activeIndex];
              if (sel) router.push(`/products/${sel.slug}`);
              setOpen(false);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Search products..."
          className={`bg-transparent placeholder-amber-700 text-amber-900 text-sm focus:outline-none ${compact ? 'w-28 sm:w-40 md:w-48' : 'w-40 sm:w-56 md:w-64'}`}
          aria-label="Search products"
        />
      </div>
      {open && suggestions.length > 0 && anchorRect && createPortal(
        <div
          className="z-[1000] rounded-xl overflow-hidden ring-1 ring-rose-200/60 bg-white/95 backdrop-blur-md shadow-lg"
          style={{ position: 'fixed', left: anchorRect.left, top: anchorRect.top + 4, width: anchorRect.width }}
        >
          <ul className="divide-y divide-rose-200/50">
            {suggestions.map((s, idx) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); router.push(`/products/${s.slug}`); setOpen(false); }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 ${activeIndex===idx ? 'bg-rose-100/70' : ''} text-amber-900`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="block w-9 h-9 rounded-md overflow-hidden bg-white/60 dark:bg-rose-900/20 ring-1 ring-rose-200/60">
                      {s.image ? (
                        <img src={imageUrl(s.image)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                      ) : null}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{(s.priceCents/100).toFixed(2)} {s.currency}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </form>
  );
}
