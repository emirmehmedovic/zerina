import { API_URL } from "@/lib/api";
import { Store, ArrowRight } from "lucide-react";
import Image from "next/image";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string;
  coverUrl?: string | null;
  coverImageStorageKey?: string | null;
};

type Product = {
  id: string;
  title: string;
  images?: { storageKey: string }[];
};

// Shop color variations
const getShopColor = (index: number) => {
  const colors = [
    { gradient: 'from-violet-200/20 to-purple-200/20', iconColor: 'text-violet-600 dark:text-violet-400', accentColor: 'bg-violet-400' },
    { gradient: 'from-sky-200/20 to-blue-200/20', iconColor: 'text-sky-600 dark:text-sky-400', accentColor: 'bg-sky-400' },
    { gradient: 'from-amber-200/20 to-orange-200/20', iconColor: 'text-amber-600 dark:text-amber-400', accentColor: 'bg-amber-400' },
    { gradient: 'from-emerald-200/20 to-teal-200/20', iconColor: 'text-emerald-600 dark:text-emerald-400', accentColor: 'bg-emerald-400' },
    { gradient: 'from-rose-200/20 to-pink-200/20', iconColor: 'text-rose-600 dark:text-rose-400', accentColor: 'bg-rose-400' },
    { gradient: 'from-indigo-200/20 to-purple-200/20', iconColor: 'text-indigo-600 dark:text-indigo-400', accentColor: 'bg-indigo-400' },
  ];
  return colors[index % colors.length];
};

export default async function ShopsPage() {
  let shops: Shop[] = [];
  let latestProducts: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/shops/public?take=12`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const base: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      shops = base.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description ?? null,
        status: s.status,
        coverUrl: s.coverUrl ?? null,
        coverImageStorageKey: s.coverImageStorageKey ?? null,
      }));
    }
    // Fetch a few latest products for the header collage
    try {
      const pr = await fetch(`${API_URL}/api/v1/products?latest=true&take=6`, { cache: 'no-store' });
      if (pr.ok) {
        const pdata = await pr.json();
        latestProducts = Array.isArray(pdata?.items) ? pdata.items : Array.isArray(pdata) ? pdata : [];
      }
    } catch {}
  } catch {}

  const buildAssetUrl = (key?: string | null): string | null => {
    if (!key) return null;
    if (key.startsWith('/uploads/')) return `${API_URL}${key}`;
    if (key.startsWith('uploads/')) return `${API_URL}/${key}`;
    return `${API_URL}/uploads/${key}`;
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Scalloped cute header */}
        <section className="mb-8 relative rounded-[28px] overflow-hidden border border-rose-100/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-amber-50 to-white" />
          <div className="absolute -bottom-4 left-0 right-0 h-6 [mask-image:radial-gradient(12px_12px_at_12px_6px,transparent_10px,#000_10px)] bg-white" />
          <div className="relative p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <div className="lg:col-span-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">
                  Artisan directory
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 tracking-tight mb-2">Discover Artisans</h1>
                <p className="text-amber-900/80 max-w-2xl">
                  Handpicked makers, cozy stories, and beautiful objects.
                </p>
              </div>
              {/* Right: small taped product collage (5 inline on lg, 3 on small) */}
              <div className="lg:col-span-2 relative flex items-start gap-3">
                {latestProducts.slice(0,5).map((p: Product, idx: number) => (
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
        
        {shops.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
            <p className="text-gray-600">No artisans to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => {
              // Resolve cover URL
              const key = shop.coverImageStorageKey ?? "";
              let cover: string | null = null;
              if (shop.coverUrl) cover = shop.coverUrl;
              else if (key) {
                if (key.startsWith("/uploads/")) cover = `${API_URL}${key}`;
                else if (key.startsWith("uploads/")) cover = `${API_URL}/${key}`;
                else cover = `${API_URL}/uploads/${key}`;
              }

              return (
                <a 
                  key={shop.id} 
                  href={`/shops/${shop.slug}`} 
                  className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 block"
                >
                  {/* Cover image */}
                  <div className="relative w-full h-40 sm:h-48 overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={`${shop.name} cover`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/60 via-white/60 to-amber-100/60" />
                    )}
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 rounded-2xl bg-white/70 border border-gray-200/80 shadow-sm">
                        <Store className="w-5 h-5 text-amber-900" />
                      </div>
                      <h3 className="font-semibold text-amber-900 text-lg truncate">{shop.name}</h3>
                    </div>
                    {/* Cute badges */}
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-pink-100/90 text-pink-800 border border-pink-200">Handcrafted</span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-100/90 text-violet-800 border border-violet-200">Small Batch</span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100/90 text-emerald-800 border border-emerald-200">Eco-friendly</span>
                    </div>
                    {/* Quote-style tease */}
                    {shop.description && (
                      <div className="rounded-xl border border-rose-100/70 bg-rose-50/40 p-3 mb-3">
                        <div className="text-rose-400 leading-none text-lg">“</div>
                        <p className="-mt-1 text-amber-900/90 text-sm line-clamp-2">{shop.description}</p>
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 bg-white/80 border border-rose-100/70 rounded-full px-3 py-1">
                      Visit shop
                      <ArrowRight className="w-4 h-4" />
                    </span>
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
