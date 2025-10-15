"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import StaticImage from "@/components/StaticImage";
import VariantSelector from "@/components/VariantSelector";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import ChatWidget from "@/components/chat/ChatWidget";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  images?: { storageKey: string; altText?: string }[];
  shop?: { id: string; name: string; slug: string };
  categories?: { category: { id: string; name: string } }[];
  variants?: { id: string; attributes: Record<string, string | number>; priceCents: number; stock: number; sku?: string }[];
};

export default function ProductDetailPage() {
  const { identifier } = useParams() as { identifier: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI states must be declared before any early returns
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [fromShop, setFromShop] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  // Reviews
  const [reviews, setReviews] = useState<{ items: any[]; average: number | null; count: number } | null>(null);
  const [me, setMe] = useState<{ id: string; name?: string } | null>(null);
  const [revRating, setRevRating] = useState<number>(5);
  const [revTitle, setRevTitle] = useState<string>("");
  const [revBody, setRevBody] = useState<string>("");
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revError, setRevError] = useState<string | null>(null);
  // From vendor carousel controls
  const vendorRef = useRef<HTMLDivElement | null>(null);
  const [vendorPaused, setVendorPaused] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try direct lookup first (works for both ID and slug)
        let res = await fetch(`${API_URL}/api/v1/products/${identifier}?include=shop`, { cache: 'no-store' });
        
        if (!res.ok) {
          // If that fails, try ID-specific endpoint as fallback
          res = await fetch(`${API_URL}/api/v1/products/id/${identifier}?include=shop`, { cache: 'no-store' });
        }
        
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        setError("Failed to load product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [identifier]);

  // Fetch reviews and current user once product is known (by id)
  useEffect(() => {
    const pid = product?.id;
    if (!pid) return;
    let active = true;
    (async () => {
      try {
        const [revRes, meRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/products/${pid}/reviews`, { cache: 'no-store', credentials: 'include' }),
          fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' }).catch(() => ({ ok: false })) as any,
        ]);
        if (revRes.ok) {
          const r = await revRes.json();
          if (active) setReviews(r);
        } else if (active) setReviews({ items: [], average: null, count: 0 });
        if ((meRes as Response)?.ok) {
          const u = await (meRes as Response).json();
          if (active) setMe(u);
        } else if (active) setMe(null);
      } catch {
        if (active) setReviews({ items: [], average: null, count: 0 });
      }
    })();
    return () => { active = false; };
  }, [product?.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;
    setRevError(null);
    setRevSubmitting(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ rating: revRating, title: revTitle || undefined, body: revBody || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to submit review (${res.status})`);
      }
      // Refresh reviews
      const revRes = await fetch(`${API_URL}/api/v1/products/${product.id}/reviews`, { cache: 'no-store', credentials: 'include' });
      if (revRes.ok) setReviews(await revRes.json());
    } catch (err: any) {
      setRevError(err?.message || 'Failed to submit review');
    } finally {
      setRevSubmitting(false);
    }
  };

  // Auto-open chat if ?chat=1
  useEffect(() => {
    const chat = searchParams?.get('chat');
    if (chat === '1') setShowChat(true);
  }, [searchParams]);

  // Fetch 'From this vendor' products when product (with shop) is loaded
  useEffect(() => {
    const shopId = (product as any)?.shop?.id || (product as any)?.shopId;
    const shopSlug = (product as any)?.shop?.slug;
    if (!shopId && !shopSlug) return;
    let active = true;
    (async () => {
      try {
        // 1) Try API-side filtering by shopId or shopSlug
        const url = shopId
          ? `${API_URL}/api/v1/products?shopId=${encodeURIComponent(shopId)}&take=24`
          : `${API_URL}/api/v1/products?shopSlug=${encodeURIComponent(shopSlug!)}&take=24`;
        const res = await fetch(url, { cache: 'no-store' });
        let items: any[] = [];
        if (res.ok) {
          const data = await res.json();
          items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        }
        // 2) Fallback: fetch latest and filter client-side if API doesn't support filters
        if (!items.length) {
          const res2 = await fetch(`${API_URL}/api/v1/products?take=50`, { cache: 'no-store' });
          if (res2.ok) {
            const data2 = await res2.json();
            const all = Array.isArray(data2?.items) ? data2.items : Array.isArray(data2) ? data2 : [];
            items = all.filter((p: any) => (shopId ? p.shopId === shopId : p.shop?.slug === shopSlug));
          }
        }
        // Exclude current product and set
        const finalItems = items.filter((p: any) => p.id !== product?.id);
        if (active) setFromShop(finalItems);
      } catch {}
    })();
    return () => { active = false; };
  }, [product?.shop?.id, (product as any)?.shopId, product?.shop?.slug, product?.id]);

  // Infinite auto-scroll for From this vendor carousel
  useEffect(() => {
    const el = vendorRef.current;
    if (!el || fromShop.length === 0) return;
    let rafId: number;
    const speed = 0.5; // px per frame
    const tick = () => {
      if (!el) return;
      if (!vendorPaused) {
        el.scrollLeft += speed;
      }
      const half = el.scrollWidth / 2; // duplicated content
      if (el.scrollLeft >= half) {
        el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [fromShop.length, vendorPaused]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base card-glass p-4">
              <div className="h-60 w-full rounded-md bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
              </div>

            
            </div>
            <div className="card-base card-glass p-4">
              <div className="h-7 w-2/3 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-3" />
              <div className="h-4 w-full rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-2" />
              <div className="h-4 w-5/6 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-6" />
              <div className="h-8 w-40 rounded-full bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-6" />
              <div className="h-10 w-48 rounded-full bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main>
        <h1 className="text-3xl font-bold mb-6">Product</h1>
        <p className="text-light-muted dark:text-dark-muted">{error || "Product not found."}</p>
      </main>
    );
  }

  const imgs = product.images ?? [];
  const mainImageStorageKey = imgs[0]?.storageKey || null;
  const variantMin = Array.isArray(product.variants) && product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;
  const displayPriceCents = variantMin !== null ? Math.min(product.priceCents, variantMin) : product.priceCents;

  // Split-Screen Gallery Rail
  const allImages = imgs.length ? imgs : (mainImageStorageKey ? [{ storageKey: mainImageStorageKey }] : []);
  // Safe vendor name for chat label
  const vendorName = product?.shop?.name ?? 'vendor';

  return (
    <>
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: vertical thumbnail rail + large image */}
          <section className="relative">
            <div className="hidden md:flex gap-3">
              {/* Rail */}
              <div className="flex flex-col gap-3 w-20 shrink-0">
                {allImages.slice(0,8).map((im, i) => (
                  <button
                    key={i}
                    aria-label={`Show image ${i+1}`}
                    onClick={()=> setSelected(i)}
                    className={`relative h-20 w-20 rounded-xl overflow-hidden border ${selected===i ? 'border-amber-300 ring-2 ring-amber-200' : 'border-amber-100'} bg-white shadow-sm`}
                  >
                    <StaticImage fileName={im.storageKey} alt={`${product.title} ${i+1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                  </button>
                ))}
              </div>
              {/* Large image */}
              <div className="relative flex-1 rounded-2xl overflow-hidden border border-rose-100/70 bg-white shadow-sm min-h-[420px]">
                <button aria-label="Open image" onClick={() => setLightboxOpen(true)} className="block h-full w-full text-left">
                  <StaticImage fileName={allImages[selected]?.storageKey || ''} alt={product.title} className="h-full w-full object-cover" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
            </div>
            {/* Mobile main image with horizontal thumbnails */}
            <div className="md:hidden">
              <div className="relative rounded-2xl overflow-hidden border border-rose-100/70 bg-white shadow-sm h-80 mb-3">
                <button aria-label="Open image" onClick={() => setLightboxOpen(true)} className="block h-full w-full text-left">
                  <StaticImage fileName={allImages[selected]?.storageKey || ''} alt={product.title} className="h-full w-full object-cover" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {allImages.slice(0,8).map((im, i) => (
                  <button
                    key={i}
                    onClick={()=> setSelected(i)}
                    className={`relative h-16 w-16 rounded-xl overflow-hidden border ${selected===i ? 'border-amber-300 ring-2 ring-amber-200' : 'border-amber-100'} bg-white shadow-sm shrink-0`}
                  >
                    <StaticImage fileName={im.storageKey} alt={`${product.title} ${i+1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right: sticky buy box */}
          <section className="md:sticky md:top-24 h-max rounded-3xl bg-white/80 backdrop-blur-md border border-rose-100/70 shadow-sm p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 tracking-tight mb-2">{product.title}</h1>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/85 text-amber-900 border border-amber-100">🧵 Handcrafted</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50/90 text-amber-900 border border-amber-100">🧺 Small Batch</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-50/90 text-stone-800 border border-stone-200">🌿 Eco-friendly</span>
            </div>
            <p className="text-amber-900/80 mb-4">{product.description?.slice(0, 240) ?? ''}</p>
            <div className="text-2xl font-semibold text-amber-900 mb-4">
              {variantMin !== null && displayPriceCents < product.priceCents ? (
                <>From {(displayPriceCents / 100).toFixed(2)} {product.currency}</>
              ) : (
                <>{(product.priceCents / 100).toFixed(2)} {product.currency}</>
              )}
            </div>
            {/* Chat toggle */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowChat((v) => !v)}
                className="px-3 py-2 rounded-md border border-amber-200 text-amber-900 bg-white/70 hover:bg-white"
              >
                {showChat ? 'Hide chat' : `Chat with ${vendorName}`}
              </button>
            </div>

            {product.variants && product.variants.length > 0 ? (
              <div className="mb-4">
                <VariantSelector
                  variants={product.variants}
                  currency={product.currency}
                  productId={product.id}
                  slug={product.slug}
                  title={product.title}
                  image={allImages[selected]?.storageKey ? `/uploads/${(allImages[selected].storageKey as string).split('/').pop()}` : null}
                  basePriceCents={product.priceCents}
                />
              </div>
            ) : (
              <div className="mb-4">
                <AddToCartButton 
                  product={{
                    productId: product.id,
                    title: product.title,
                    slug: product.slug,
                    priceCents: product.priceCents,
                    currency: product.currency,
                    image: allImages[selected]?.storageKey ? `/uploads/${(allImages[selected].storageKey as string).split('/').pop()}` : null
                  }} 
                />
              </div>
            )}

            {/* Accordions */}
            <div className="mt-4 space-y-2">
              <details className="rounded-xl border border-amber-100 bg-white/70 p-3 open:bg-white">
                <summary className="cursor-pointer text-sm font-medium text-amber-900">Materials & Care</summary>
                <ul className="mt-2 text-sm text-amber-900/80 space-y-1">
                  <li>• Natural materials</li>
                  <li>• Wipe with a soft cloth</li>
                  <li>• Avoid prolonged sun exposure</li>
                </ul>
              </details>
              <details className="rounded-xl border border-amber-100 bg-white/70 p-3 open:bg-white">
                <summary className="cursor-pointer text-sm font-medium text-amber-900">Shipping & Returns</summary>
                <p className="mt-2 text-sm text-amber-900/80">Ships in 2–4 days. Free returns within 14 days.</p>
              </details>
              {product.categories && product.categories.length > 0 && (
                <details className="rounded-xl border border-amber-100 bg-white/70 p-3 open:bg-white">
                  <summary className="cursor-pointer text-sm font-medium text-amber-900">Categories</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.categories.map((pc) => (
                      <span key={pc.category.id} className="text-xs px-2 py-1 rounded-full bg-white/85 border border-amber-100 text-amber-900">
                        {pc.category.name}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </section>
        </div>
      </div>
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full max-w-4xl h-[70vh]" onClick={(e)=>e.stopPropagation()}>
            <StaticImage fileName={allImages[selected]?.storageKey || ''} alt={product.title} className="h-full w-full object-contain bg-white/5 rounded-lg" />
            <button aria-label="Close" onClick={() => setLightboxOpen(false)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-amber-900 border border-amber-100 shadow">✕</button>
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
              {allImages.slice(0,8).map((im, i)=> (
                <button key={i} onClick={()=> setSelected(i)} className={`h-3 w-3 rounded-full ${selected===i ? 'bg-white' : 'bg-white/50'}`} aria-label={`Select image ${i+1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
      

      {/* Related picks */}
      {related.length > 0 && (
        <section className="mt-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">Related Picks</h2>
            <div className="relative overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
              <div className="flex gap-4 min-w-full">
                {related.slice(0,8).map((p:any) => (
                  <div key={p.id} className="snap-start shrink-0 w-64">
                    <ProductCard product={{
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      priceCents: p.priceCents,
                      currency: p.currency,
                      images: p.images,
                      shop: p.shop ? { name: p.shop.name } : undefined,
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      
      
      {/* From this vendor - infinite carousel (styled like Overall Picks) */}
      {fromShop.length > 0 && (
        <section className="mt-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-amber-900">From this vendor</h2>
              <div className="text-xs text-amber-900/70">More from the same shop</div>
            </div>
            <div
              ref={vendorRef}
              onMouseEnter={() => setVendorPaused(true)}
              onMouseLeave={() => setVendorPaused(false)}
              className="relative overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [ &::-webkit-scrollbar]:hidden"
            >
              <div className="inline-flex gap-4 pr-4">
                {[...fromShop, ...fromShop].slice(0, Math.max(10, fromShop.length * 2)).map((p: any, idx: number) => (
                  <div key={`${p.id}-${idx}`} className="shrink-0 w-56">
                    <div className={`relative rounded-[20px] bg-white shadow-md border border-amber-100 p-2 overflow-hidden ${idx%2===0 ? 'rotate-[-0.8deg]' : 'rotate-[0.8deg]' }`}>
                      <div className="relative h-40 w-full rounded-[14px] overflow-hidden">
                        {p.images?.[0]?.storageKey ? (
                          <StaticImage fileName={p.images[0].storageKey} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-amber-50" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      </div>
                      <div className="px-2 pt-2 pb-3">
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/85 text-amber-900 border border-amber-100">Vendor</span>
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
                aria-label="Previous"
                onClick={() => { const el = vendorRef.current; if (!el) return; el.scrollBy({ left: -240, behavior: 'smooth' }); }}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => { const el = vendorRef.current; if (!el) return; el.scrollBy({ left: 240, behavior: 'smooth' }); }}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-amber-100 shadow"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}
      {/* Reviews */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-amber-900">Reviews</h2>
            <div className="text-xs text-amber-900/70">
              {reviews?.count ? `${reviews.average?.toFixed(1) ?? '-'} / 5 • ${reviews.count} reviews` : 'No reviews yet'}
            </div>
          </div>
          {/* Cards rail */}
          <div className="relative overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex gap-4 pr-4 min-w-full snap-x snap-mandatory">
              {(reviews?.items || []).map((rv) => (
                <div key={rv.id} className="snap-start shrink-0 w-80">
                  <div className="rounded-2xl bg-white/85 backdrop-blur-sm border border-amber-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-sm font-semibold">
                          {(rv.user?.name || rv.user?.email || 'U').slice(0,1).toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold text-amber-900 leading-tight">{rv.user?.name || rv.user?.email || 'User'}</div>
                          {rv.title && <div className="text-xs text-amber-900/70 leading-tight">{rv.title}</div>}
                        </div>
                      </div>
                      <div className="text-amber-900">{'★'.repeat(rv.rating).padEnd(5, '☆')}</div>
                    </div>
                    {rv.body && <div className="text-amber-900/80 text-sm mt-3 line-clamp-5">{rv.body}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          {me ? (
            <form onSubmit={submitReview} className="mt-6 rounded-2xl border border-amber-100 bg-white/85 backdrop-blur-sm p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-amber-900/80">Your rating</div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((n)=> (
                    <button
                      type="button"
                      key={n}
                      onClick={()=> setRevRating(n)}
                      className={`text-2xl transition-colors ${n <= revRating ? 'text-amber-900' : 'text-amber-900/30'}`}
                      aria-label={`Rate ${n} star${n>1?'s':''}`}
                    >★</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <input
                  value={revTitle}
                  onChange={(e)=> setRevTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="rounded-lg border border-amber-200 px-3 py-2 bg-white/95 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <textarea
                  value={revBody}
                  onChange={(e)=> setRevBody(e.target.value)}
                  placeholder="Share more details (optional)"
                  rows={4}
                  className="rounded-lg border border-amber-200 px-3 py-2 bg-white/95 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
              {revError && <div className="mt-2 text-sm text-red-700">{revError}</div>}
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={revSubmitting} className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200">
                  {revSubmitting ? 'Saving…' : 'Save review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-5 text-sm text-amber-900/70">Please <a className="underline" href="/login">sign in</a> to write a review.</div>
          )}
        </div>
      </section>
    </main>
    {showChat && (
      <ChatWidget productId={product.id} vendorName={vendorName} />
    )}
    </>
  );
}
