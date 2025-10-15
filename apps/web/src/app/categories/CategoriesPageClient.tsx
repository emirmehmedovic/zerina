"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Palette, Shirt, Home, Gem, Gamepad2, Package, ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import { API_URL } from "@/lib/api";

type Category = { id: string; name: string; parentId?: string | null; slug?: string };

// Icon and color mapping
const getCategoryStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('art') || lowerName.includes('craft')) {
    return { 
      icon: Palette, 
      gradient: 'from-violet-200/20 to-purple-200/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      accentColor: 'bg-violet-400'
    };
  }
  if (lowerName.includes('clothing') || lowerName.includes('fashion')) {
    return { 
      icon: Shirt, 
      gradient: 'from-sky-200/20 to-blue-200/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      accentColor: 'bg-sky-400'
    };
  }
  if (lowerName.includes('home') || lowerName.includes('living')) {
    return { 
      icon: Home, 
      gradient: 'from-amber-200/20 to-orange-200/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentColor: 'bg-amber-400'
    };
  }
  if (lowerName.includes('jewelry') || lowerName.includes('jewel')) {
    return { 
      icon: Gem, 
      gradient: 'from-emerald-200/20 to-teal-200/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentColor: 'bg-emerald-400'
    };
  }
  if (lowerName.includes('toy') || lowerName.includes('game')) {
    return { 
      icon: Gamepad2, 
      gradient: 'from-rose-200/20 to-pink-200/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      accentColor: 'bg-rose-400'
    };
  }
  return { 
    icon: Package, 
    gradient: 'from-zinc-200/20 to-slate-200/20',
    iconColor: 'text-zinc-600 dark:text-zinc-400',
    accentColor: 'bg-zinc-400'
  };
};

type Product = { id: string; title: string; images?: { storageKey: string }[] };

const themes = [
  { key: 'all', label: 'All', keywords: [] as string[] },
  { key: 'art', label: 'Art & Craft', keywords: ['art', 'craft'] },
  { key: 'home', label: 'Home & Living', keywords: ['home', 'living', 'decor'] },
  { key: 'fashion', label: 'Fashion', keywords: ['fashion', 'clothing', 'apparel'] },
  { key: 'jewelry', label: 'Jewelry', keywords: ['jewel', 'jewelry'] },
  { key: 'toys', label: 'Toys & Games', keywords: ['toy', 'game'] },
];

export default function CategoriesPageClient({ items, latestProducts }: { items: Category[]; latestProducts: Product[] }) {
  const [query, setQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<string>('all');
  const [spotlight, setSpotlight] = useState<Category | null>(items[0] || null);

  const textFiltered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(c => c.name.toLowerCase().includes(q));
  }, [items, query]);

  const themed = useMemo(() => {
    if (activeTheme === 'all') return textFiltered;
    const theme = themes.find(t => t.key === activeTheme);
    if (!theme) return textFiltered;
    return textFiltered.filter(c => theme.keywords.some(k => c.name.toLowerCase().includes(k)));
  }, [textFiltered, activeTheme]);

  const filtered = themed;

  // Art & Craft filtered products for the special carousel
  const artProducts = useMemo(() => {
    const kws = ['art', 'craft', 'handmade', 'artisan'];
    return (latestProducts || []).filter(p => {
      const t = (p.title || '').toLowerCase();
      return kws.some(k => t.includes(k));
    });
  }, [latestProducts]);

  // Overall Picks infinite carousel (uses latestProducts, loops)
  const picksRef = useRef<HTMLDivElement | null>(null);
  const [picksPaused, setPicksPaused] = useState(false);
  useEffect(() => {
    const el = picksRef.current;
    if (!el) return;
    let rafId: number;
    const speed = 0.5; // px per frame
    const tick = () => {
      if (!el) return;
      if (!picksPaused) {
        el.scrollLeft += speed;
      }
      // loop when reaching half (since we'll render duplicated content)
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [latestProducts.length, picksPaused]);

  // Inline Art & Craft mini-carousel (auto-scroll within the card)
  const artCarouselRef = useRef<HTMLDivElement | null>(null);
  const artPausedRef = useRef<boolean>(false);
  useEffect(() => {
    const el = artCarouselRef.current;
    if (!el) return;
    let dir = 1;
    const scrollBy = 180; // one mini card width
    const id = setInterval(() => {
      if (!el) return;
      if (artPausedRef.current) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + dir * scrollBy;
      if (next >= max) {
        el.scrollTo({ left: max, behavior: 'smooth' });
        dir = -1;
      } else if (next <= 0) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        dir = 1;
      } else {
        el.scrollTo({ left: next, behavior: 'smooth' });
      }
    }, 2800);
    return () => clearInterval(id);
  }, [artProducts.length]);

  const buildAssetUrl = (key?: string | null): string | null => {
    if (!key) return null;
    if (key.startsWith('/uploads/')) return `${API_URL}${key}`;
    if (key.startsWith('uploads/')) return `${API_URL}/${key}`;
    return `${API_URL}/uploads/${key}`;
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Cute scalloped header with taped collage */}
        <section className="mb-8 relative rounded-[28px] overflow-hidden border border-rose-100/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-amber-50 to-white" />
          <div className="absolute -bottom-4 left-0 right-0 h-6 [mask-image:radial-gradient(12px_12px_at_12px_6px,transparent_10px,#000_10px)] bg-white" />
          <div className="relative p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <div className="lg:col-span-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">
                  Category directory
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 tracking-tight mb-2">
                  Browse Categories
                </h1>
                <p className="text-amber-900/80 max-w-2xl">
                  Find exactly what you’re looking for across our artisan catalog.
                </p>
                <div className="mt-4 flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700/70" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e)=>setQuery(e.target.value)}
                      placeholder="Search categories"
                      className="w-full md:w-80 pl-9 pr-3 py-2 rounded-full bg-white/80 border border-rose-100/70 text-amber-900 placeholder:text-amber-700/70 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                </div>

                {/* Theme chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {themes.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTheme(t.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition border ${activeTheme===t.key ? 'bg-amber-100/90 text-amber-900 border-amber-200' : 'bg-white/80 text-amber-900 border-rose-100 hover:bg-white'}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              {/* Right: small taped product collage */}
              <div className="lg:col-span-2 relative flex items-start gap-3">
                {latestProducts.slice(0,5).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`relative h-20 sm:h-24 w-16 sm:w-20 rounded-[14px] bg-white shadow-md border border-amber-100 p-1 ${idx%2===0 ? 'rotate-[-3deg]' : 'rotate-[2.5deg]'} overflow-hidden ${idx >= 3 ? 'hidden lg:block' : ''}`}
                  >
                    <div className="relative h-full w-full rounded-[10px] overflow-hidden">
                      {p.images?.[0]?.storageKey ? (
                        <Image
                          src={buildAssetUrl(p.images[0].storageKey) || '/placeholder-product.svg'}
                          alt={p.title}
                          fill
                          sizes="(max-width: 1024px) 15vw, 10vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-amber-50" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="absolute -top-2 right-3 w-10 h-5 rotate-6 bg-amber-100/90 border border-amber-200/80 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Art & Craft Picks carousel (shown when data exists) */}
        {(artProducts.length > 0 || latestProducts.length > 0) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-amber-900">Art & Craft Picks</h2>
              <div className="text-xs text-amber-900/70">Curated inspiration</div>
            </div>
            <div className="relative overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
              <div className="flex gap-4 min-w-full">
                {(artProducts.length>0 ? artProducts : latestProducts).slice(0,10).map((p, idx) => (
                  <div key={p.id} className="snap-start shrink-0 w-56">
                    <div className={`relative rounded-[20px] bg-white shadow-md border border-amber-100 p-2 overflow-hidden ${idx%2===0 ? 'rotate-[-0.8deg]' : 'rotate-[0.8deg]' }`}>
                      {/* tape */}
                      <div className="absolute -top-2 left-6 w-14 h-6 rotate-6 bg-amber-100/90 border border-amber-200/80 rounded-sm" />
                      <div className="relative h-40 w-full rounded-[14px] overflow-hidden">
                        {p.images?.[0]?.storageKey ? (
                          <Image
                            src={buildAssetUrl(p.images[0].storageKey) || '/placeholder-product.svg'}
                            alt={p.title}
                            fill
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            className="object-cover"
                          />)
                          : (<div className="absolute inset-0 bg-amber-50" />)}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      </div>
                      <div className="px-2 pt-2 pb-3">
                        {/* beige badges */}
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/85 text-amber-900 border border-amber-100">🧵 Art & Craft</span>
                        </div>
                        <div className="text-sm font-semibold text-amber-900 line-clamp-2">{p.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Arrow controls */}
              <button
                type="button"
                aria-label="Previous picks"
                onClick={() => { const el = picksRef.current; if (!el) return; el.scrollBy({ left: -240, behavior: 'smooth' }); }}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next picks"
                onClick={() => { const el = picksRef.current; if (!el) return; el.scrollBy({ left: 240, behavior: 'smooth' }); }}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
              >
                ›
              </button>
            </div>
          </section>
        )}

        {/* Spotlight + Tag cloud */}
        {filtered.length > 0 && (
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            {/* Spotlight card */}
            <div className="lg:col-span-3 rounded-3xl bg-white/80 backdrop-blur-md border border-rose-100/70 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-amber-900 mb-2">Spotlight</h2>
              <p className="text-amber-900/80 mb-4">Discover the charm of {spotlight?.name || filtered[0].name}</p>
              <div className="rounded-2xl border border-rose-100/80 bg-rose-50/40 p-4">
                <div className="text-rose-500 text-xl leading-none">“</div>
                <p className="-mt-2 text-amber-900/90 text-sm sm:text-base leading-relaxed">
                  Explore {spotlight?.name || filtered[0].name} through handcrafted pieces and small-batch goods.
                </p>
              </div>
              <a href={`/products?categoryId=${encodeURIComponent(spotlight?.id || filtered[0].id)}`} className="inline-flex items-center mt-4 px-4 py-2 rounded-full bg-amber-100/90 hover:bg-amber-100 text-amber-900 font-medium shadow-sm transition w-max">
                View {spotlight?.name || filtered[0].name}
              </a>
            </div>

            {/* Tag cloud */}
            <div className="lg:col-span-2 rounded-3xl bg-white/70 border border-rose-100/70 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-amber-900 mb-3">Explore tags</h3>
              <div className="flex flex-wrap gap-2">
                {filtered.slice(0,40).map((c, idx) => (
                  <button
                    key={c.id}
                    onMouseEnter={()=> setSpotlight(c)}
                    onClick={()=> setSpotlight(c)}
                    className={`rounded-full border px-3 py-1 transition ${spotlight?.id===c.id ? 'bg-amber-100/90 border-amber-200 text-amber-900' : 'bg-white/80 border-rose-100 text-amber-900 hover:bg-white'}`}
                    style={{ fontSize: `${12 + (idx % 3) * 1.5}px` }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured horizontal carousel */}
        {filtered.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">Featured Categories</h2>
            <div className="relative overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
              <div className="flex gap-4 min-w-full">
                {filtered.slice(0,12).map((cat, idx) => {
                  const style = getCategoryStyle(cat.name);
                  const Icon = style.icon;
                  return (
                    <a key={cat.id} href={`/products?categoryId=${encodeURIComponent(cat.id)}`} className="snap-start shrink-0 w-64 rounded-2xl p-5 bg-gradient-to-br from-amber-50/60 via-white/70 to-rose-50/60 border border-white/60 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-white/80 border border-gray-200/70 shadow-sm"><Icon className={`w-5 h-5 ${style.iconColor}`} /></div>
                        <h3 className="font-semibold text-amber-900 truncate">{cat.name}</h3>
                      </div>
                      <div className="text-amber-900/80 text-sm">Explore {cat.name}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
            <p className="text-gray-600 mb-3">No categories match your search.</p>
            <button onClick={()=>setQuery("")} className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-900 text-sm shadow-sm hover:shadow">Clear search</button>
          </div>
        ) : (
          // Quilted masonry-like grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((cat) => {
              const style = getCategoryStyle(cat.name);
              const Icon = style.icon;
              const idx = filtered.findIndex(c=>c.id===cat.id);
              const sizeCls = idx % 6 === 0 ? 'lg:col-span-2 lg:row-span-2' : idx % 6 === 1 ? 'lg:col-span-2' : '';
              return (
                <a
                  key={cat.id}
                  href={`/products?categoryId=${encodeURIComponent(cat.id)}`}
                  className={`rounded-2xl p-6 block relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 ${sizeCls}`}
                >
                  <div className="relative flex items-start gap-4">
                    {/* Icon chip */}
                    <div className="flex-shrink-0 p-3 rounded-xl bg-white/70 border border-gray-200/80 shadow-sm">
                      <Icon className={`w-6 h-6 ${style.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-amber-900">
                          {cat.name}
                        </h3>
                        <span className={`inline-block w-1.5 h-1.5 ${style.accentColor} rounded-full`} />
                      </div>
                      {/* Cute badges */}
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/85 text-amber-900 border border-amber-100">🧵 Handcrafted</span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50/90 text-amber-900 border border-amber-100">🧺 Small Batch</span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-50/90 text-stone-800 border border-stone-200">🌿 Eco-friendly</span>
                      </div>
                      {/* Quote-style tease */}
                      <div className="rounded-xl border border-rose-100/70 bg-rose-50/40 p-3 mb-3">
                        <div className="text-rose-400 leading-none text-lg">“</div>
                        <p className="-mt-1 text-amber-900/90 text-sm">Explore {cat.name}</p>
                      </div>

                      {/* Inline Art & Craft carousel with pause and arrows */}
                      {((cat.name.toLowerCase().includes('art') || cat.name.toLowerCase().includes('craft')) && artProducts.length > 0) && (
                        <div className="mb-3 relative">
                          <div
                            ref={artCarouselRef}
                            onMouseEnter={() => { artPausedRef.current = true; }}
                            onMouseLeave={() => { artPausedRef.current = false; }}
                            className="relative overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [ &::-webkit-scrollbar]:hidden"
                          >
                            <div className="flex gap-3 min-w-full">
                              {artProducts.slice(0,8).map((p, idx) => (
                                <div key={p.id} className="snap-start shrink-0 w-36">
                                  <div className={`relative rounded-[16px] bg-white shadow border border-amber-100 p-1.5 overflow-hidden ${idx%2===0 ? 'rotate-[-0.6deg]' : 'rotate-[0.6deg]' }`}>
                                    <div className="relative h-24 w-full rounded-[10px] overflow-hidden">
                                      {p.images?.[0]?.storageKey ? (
                                        <Image
                                          src={buildAssetUrl(p.images[0].storageKey) || '/placeholder-product.svg'}
                                          alt={p.title}
                                          fill
                                          sizes="(max-width: 1024px) 40vw, 20vw"
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 bg-amber-50" />
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                    <div className="px-1.5 pt-1.5 pb-2">
                                      <div className="text-[12px] font-semibold text-amber-900 line-clamp-2">{p.title}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Arrows */}
                          <button
                            type="button"
                            aria-label="Prev"
                            onClick={() => { const el = artCarouselRef.current; if (!el) return; el.scrollBy({ left: -200, behavior: 'smooth' }); }}
                            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            aria-label="Next"
                            onClick={() => { const el = artCarouselRef.current; if (!el) return; el.scrollBy({ left: 200, behavior: 'smooth' }); }}
                            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
                          >
                            ›
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <span>View collection</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
