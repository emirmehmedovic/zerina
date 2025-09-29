import { API_URL } from "@/lib/api";
type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  products: Array<{ id: string; title: string; slug: string; priceCents: number; currency: string }>;
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
      <main>
        <h1 className="text-3xl font-bold mb-2">Shop</h1>
        <p className="text-light-muted dark:text-dark-muted">Shop not found.</p>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-6 card-base card-glass">
        <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
        {shop.description && (
          <p className="text-light-muted dark:text-dark-muted">{shop.description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shop.products.map((p) => (
          <article key={p.id} className="card-base card-glass card-hover">
            {Array.isArray((p as any).images) && (p as any).images.length > 0 ? (
              <img src={`${API_URL}${(p as any).images[0].storageKey}`} alt={p.title} className="h-40 w-full object-cover rounded-md mb-3" loading="lazy" />
            ) : (
              <div className="h-40 bg-light-muted/10 dark:bg-dark-muted/10 rounded-md mb-3"/>
            )}
            <h3 className="font-semibold mb-1">{p.title}</h3>
            <p className="text-light-muted dark:text-dark-muted text-sm">{(p.priceCents/100).toFixed(2)} {p.currency}</p>
            <a className="btn-primary inline-block mt-3" href={`/products/${p.id}`}>View product</a>
          </article>
        ))}
      </div>
    </main>
  );
}
