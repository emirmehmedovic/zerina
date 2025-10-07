import { API_URL } from "@/lib/api";
import Link from "next/link";
import StaticImage from "@/components/StaticImage";
import GlobalHeroBackground from "@/components/ui/global-hero-background";

export const dynamic = "force-dynamic";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageStorageKey?: string | null;
  publishedAt?: string | null;
  tags: string[];
  author?: { id: string; name: string | null };
  shop?: { id: string; name: string; slug: string } | null;
};

async function fetchPosts(searchParams: { page?: string; tag?: string; shopSlug?: string }) {
  const take = 9;
  const page = Math.max(parseInt(searchParams.page || "1", 10) || 1, 1);
  const skip = (page - 1) * take;
  const url = new URL(`${API_URL}/api/v1/blog`);
  url.searchParams.set("take", String(take));
  url.searchParams.set("skip", String(skip));
  url.searchParams.set("status", "PUBLISHED");
  if (searchParams.tag) url.searchParams.set("tag", searchParams.tag);
  if (searchParams.shopSlug) url.searchParams.set("shopSlug", searchParams.shopSlug);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { items: [], total: 0 } as { items: BlogPost[]; total: number };
  return (await res.json()) as { items: BlogPost[]; total: number };
}

export default async function ArtisanChroniclesPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const tag = typeof searchParams?.tag === "string" ? searchParams!.tag : undefined;
  const shopSlug = typeof searchParams?.shop === "string" ? searchParams!.shop : undefined;
  const page = typeof searchParams?.page === "string" ? searchParams!.page : "1";
  const data = await fetchPosts({ page, tag, shopSlug });
  const items = data.items || [];
  const total = data.total || 0;
  const take = 9;
  const current = Math.max(parseInt(page || "1", 10) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / take), 1);

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Ambient background without hero image to match homepage/login/register */}
      <GlobalHeroBackground useImage={false} />

      {/* Animated SVG ornaments from /public/svgs (same as login/register) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <img src="/svgs/1.svg" alt="" className="absolute opacity-[0.20] animate-float-slow select-none" style={{ top: '6%', left: '4%', width: '220px' }} />
        <img src="/svgs/2.svg" alt="" className="absolute opacity-[0.18] animate-drift select-none" style={{ bottom: '10%', left: '12%', width: '260px' }} />
        <img src="/svgs/3.svg" alt="" className="absolute opacity-[0.16] animate-float select-none" style={{ top: '12%', right: '8%', width: '280px' }} />
        {/* Swap: 5.svg bottom-right, 4.svg center */}
        <img src="/svgs/5.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden md:block" style={{ bottom: '6%', right: '4%', width: '320px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/4.svg" alt="" className="absolute opacity-[0.14] animate-drift-slow select-none" style={{ top: '40%', left: '50%', transform: 'translateX(-50%)', width: '360px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        {/* Additional */}
        <img src="/svgs/7.svg" alt="" className="absolute opacity-[0.10] animate-drift-slow select-none hidden sm:block" style={{ top: '18%', left: '18%', width: '260px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/8.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden lg:block" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: '300px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/9.svg" alt="" className="absolute opacity-[0.08] animate-float-slow select-none hidden xl:block" style={{ top: '8%', right: '24%', width: '340px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900">Artisan Chronicles</h1>
          <p className="text-amber-900/70 mt-1">Stories and guides from our vendors.</p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-white/70 backdrop-blur-md p-8 text-center text-amber-900/70">No posts yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => {
              const fileName = p.coverImageStorageKey ? `/uploads/${p.coverImageStorageKey.split('/').pop()}` : null;
              return (
                <article key={p.id} className="rounded-2xl border border-amber-100 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                  <Link href={`/artisan-chronicles/${p.slug}`} className="block relative h-48">
                    {fileName ? (
                      <StaticImage fileName={fileName} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-amber-50" />
                    )}
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold text-amber-900 mb-1">
                      <Link href={`/artisan-chronicles/${p.slug}`}>{p.title}</Link>
                    </h2>
                    {p.excerpt && <p className="text-sm text-amber-900/80 line-clamp-3">{p.excerpt}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.shop?.slug && (
                        <Link href={`/artisan-chronicles?shop=${encodeURIComponent(p.shop.slug)}`} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-amber-100 text-amber-900">{p.shop.name}</Link>
                      )}
                      {p.tags?.slice(0,3).map((t) => (
                        <Link key={t} href={`/artisan-chronicles?tag=${encodeURIComponent(t)}`} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-100">#{t}</Link>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 text-xs text-amber-900/60">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Link href={`/artisan-chronicles?page=${Math.max(current - 1, 1)}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${shopSlug ? `&shop=${encodeURIComponent(shopSlug)}` : ''}`} className={`px-3 py-1.5 rounded-lg border ${current === 1 ? 'pointer-events-none opacity-50' : 'bg-white border-amber-100 text-amber-900'}`}>Prev</Link>
            <span className="text-sm text-amber-900/70">Page {current} of {totalPages}</span>
            <Link href={`/artisan-chronicles?page=${Math.min(current + 1, totalPages)}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}${shopSlug ? `&shop=${encodeURIComponent(shopSlug)}` : ''}`} className={`px-3 py-1.5 rounded-lg border ${current === totalPages ? 'pointer-events-none opacity-50' : 'bg-white border-amber-100 text-amber-900'}`}>Next</Link>
          </div>
        )}
      </div>
    </main>
  );
}
