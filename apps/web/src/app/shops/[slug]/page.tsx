import { API_URL } from "@/lib/api";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  coverUrl?: string | null;
  coverImageStorageKey?: string | null;
  story?: string | null;
  products: Array<{ id: string; title: string; slug: string; priceCents: number; currency: string; images?: { storageKey: string }[] }>;
};

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let shop: Shop | null = null;
  try {
    const res = await fetch(`${API_URL}/api/v1/shops/${slug}`, { cache: 'no-store' });
    if (res.ok) shop = await res.json();
  } catch {}

  if (!shop) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Shop</h1>
          <p className="text-light-muted dark:text-dark-muted">Shop not found.</p>
        </div>
      </main>
    );
  }

  // Resolve asset URL for possible cover images from API
  const buildAssetUrl = (key?: string | null): string | null => {
    if (!key) return null;
    if (key.startsWith('http')) return key;
    if (key.startsWith('/uploads/')) return `${API_URL}${key}`;
    if (key.startsWith('uploads/')) return `${API_URL}/${key}`;
    return `${API_URL}/uploads/${key}`;
  };
  const coverUrl = shop.coverUrl
    || buildAssetUrl(shop.coverImageStorageKey)
    || buildAssetUrl(shop.products?.[0]?.images?.[0]?.storageKey)
    || null;

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Cute Artisanal Hero - Two Columns */}
        <section className="mb-10 relative rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-rose-100/60 bg-gradient-to-br from-rose-50 via-amber-50 to-white">
          <div className="relative p-5 sm:p-7 md:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left column: cover with badges + quote */}
              <div className="relative rounded-3xl overflow-hidden border border-rose-100/70 min-h-[340px]">
                {coverUrl ? (
                  <Image src={coverUrl} alt={`${shop.name} cover`} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-amber-100 to-rose-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                {/* Foreground content */}
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end">
                  <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">{shop.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100/90 text-pink-800 border border-pink-200">Handcrafted</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100/90 text-violet-800 border border-violet-200">Small Batch</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100/90 text-emerald-800 border border-emerald-200">Eco-friendly</span>
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md p-4">
                    <div className="text-rose-100 text-xl leading-none">“</div>
                    <p className="-mt-2 text-white/95 text-sm sm:text-base leading-relaxed">
                      {(shop.story || shop.description || 'Each piece is crafted with care, inspired by cozy mornings and slow afternoons.')}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-white/85 text-xs">
                    <span>
                      {shop.products.length} {shop.products.length === 1 ? 'product' : 'products'}
                    </span>
                    <a href="#products" className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-amber-900 font-medium shadow-sm transition">
                      Browse Products
                    </a>
                    <a href="#story" className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-100/90 hover:bg-amber-100 text-amber-900 font-medium shadow-sm transition">
                      Our Story
                    </a>
                  </div>
                </div>
              </div>

              {/* Right column: polaroid product collage */}
              <div className="relative grid grid-cols-2 gap-4">
                {shop.products.slice(0,4).map((p, idx) => (
                  <div key={p.id} className={`relative aspect-[4/5] rounded-[18px] bg-white shadow-md border border-amber-100 p-1 ${idx%2===0 ? 'rotate-[-3deg]' : 'rotate-[2.5deg]'} overflow-hidden`}>
                    <div className="relative h-full w-full rounded-[14px] overflow-hidden">
                      {p.images?.[0]?.storageKey ? (
                        <Image
                          src={buildAssetUrl(p.images[0].storageKey) || '/placeholder-product.svg'}
                          alt={p.title}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-amber-50" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/25 to-transparent" />
                    </div>
                    <div className="absolute -bottom-2 left-3 w-10 h-10 bg-amber-200/60 rounded-full blur-md pointer-events-none" />
                  </div>
                ))}
                {/* Decorative tape */}
                <div className="pointer-events-none absolute -top-2 right-6 w-16 h-6 rotate-6 bg-amber-100/90 border border-amber-200/80 rounded-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid using shared ProductCard */}
        <div id="products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shop.products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                title: p.title,
                slug: p.slug,
                priceCents: p.priceCents,
                currency: p.currency,
                images: p.images,
                shop: { name: shop.name },
              }}
            />
          ))}
        </div>

        {/* Our Story / Description (moved below products) */}
        {(shop.story || shop.description) && (
          <section id="story" className="mt-8 bg-gradient-to-br from-rose-50/30 via-white to-amber-50/20 rounded-2xl border border-rose-100/40 shadow-sm">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Story</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {shop.story || shop.description}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
