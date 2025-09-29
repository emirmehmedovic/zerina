import { API_URL } from "@/lib/api";
type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string; slug: string };

export default async function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let data: { items: Product[]; total: number; category?: { id: string; name: string } } = { items: [], total: 0 };
  let categories: Category[] = [];
  try {
    const [res, resCats] = await Promise.all([
      fetch(`${API_URL}/api/v1/categories/${slug}/products?take=12`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' }),
    ]);
    if (res.ok) {
      data = await res.json();
    }
    if (resCats.ok) {
      const raw = await resCats.json();
      const base = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      categories = base.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug || c.name?.toLowerCase?.().replace(/[^a-z0-9]+/g,'-') }));
    }
  } catch {}

  const title = data.category?.name ?? slug;

  // Helper to build a robust image URL on the server
  const buildImageUrl = (storageKey?: string): string | null => {
    if (!storageKey) return null;
    if (storageKey.startsWith('http')) return storageKey;
    if (storageKey.startsWith('/uploads/')) return `${API_URL}${storageKey}`;
    const file = storageKey.split('/').pop() || storageKey;
    return `${API_URL}/uploads/${file}`;
  };

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-4">Category: {data.category?.name ?? slug}</h1>
        {categories.length > 0 && (
          <div className="card-base card-glass p-3 mb-6">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Browse categories</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <a key={c.id} href={`/categories/${c.slug}`} className={`text-xs px-2 py-1 rounded-full border ${c.slug===slug ? 'bg-white/40 dark:bg-zinc-800/40' : ''}`}>{c.name}</a>
              ))}
            </div>
          </div>
        )}
        {data.items.length === 0 ? (
          <p className="text-light-muted dark:text-dark-muted">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((p) => {
              const img = buildImageUrl(p.images?.[0]?.storageKey);
              return (
                <article key={p.id} className="card-base card-glass card-hover p-4">
                  {img ? (
                    <img src={img} alt={p.title} className="h-40 w-full object-cover rounded-md mb-3" loading="lazy" />
                  ) : (
                    <div className="h-40 bg-light-muted/10 dark:bg-dark-muted/10 rounded-md mb-3"/>
                  )}
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-light-muted dark:text-dark-muted text-sm">{(p.priceCents/100).toFixed(2)} {p.currency}</p>
                  <a className="btn-primary inline-block mt-3" href={`/products/${p.slug}`}>View product</a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
