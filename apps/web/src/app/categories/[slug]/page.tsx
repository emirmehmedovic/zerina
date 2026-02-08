import { API_URL } from "@/lib/api";
import { Metadata } from 'next';
import CategoriesClient from "./CategoriesClient";
import { redirect } from "next/navigation";
type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string; slug: string };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let categoryName = params.slug;

  try {
    const res = await fetch(`${API_URL}/api/v1/categories/${params.slug}/products?take=1`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      categoryName = data.category?.name || params.slug;
    }
  } catch {}

  return {
    title: `${categoryName} - Handmade Products`,
    description: `Explore handmade ${categoryName.toLowerCase()} from UAE artisans. Unique, handcrafted products made with love in Dubai, Abu Dhabi, and Sharjah.`,
    keywords: [
      'handmade',
      categoryName,
      'UAE',
      'Dubai',
      'artisan',
      'crafts',
    ],
    openGraph: {
      title: `${categoryName} | Handmade Love Filled`,
      description: `Explore handmade ${categoryName.toLowerCase()} from UAE artisans.`,
      url: `https://handmadelovefilled.com/categories/${params.slug}`,
    },
  };
}

export default async function CategoryDetailPage({ params, searchParams }: { params: { slug: string }, searchParams?: { take?: string; skip?: string } }) {
  const { slug } = params;
  const take = Math.max(1, Math.min(60, Number(searchParams?.take) || 12));
  const skip = Math.max(0, Number(searchParams?.skip) || 0);
  let data: { items: Product[]; total: number; category?: { id: string; name: string } } = { items: [], total: 0 };
  let categories: Category[] = [];
  try {
    const [res, resCats] = await Promise.all([
      fetch(`${API_URL}/api/v1/categories/${slug}/products?take=${take}&skip=${skip}` , { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' }),
    ]);
    if (resCats.ok) {
      const raw = await resCats.json();
      const base = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      categories = base.map((c: { id: string; name: string; slug?: string }) => ({ id: c.id, name: c.name, slug: c.slug || c.name?.toLowerCase?.().replace(/[^a-z0-9]+/g,'-') }));
      const match = categories.find(c => c.slug === slug);
      if (match) {
        // Always redirect slug page to products filtered by categoryId
        redirect(`/products?categoryId=${match.id}`);
      }
    }
    if (res.ok) {
      data = await res.json();
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://handmadelovefilled.com' },
              { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://handmadelovefilled.com/categories' },
              { '@type': 'ListItem', position: 3, name: title, item: `https://handmadelovefilled.com/categories/${slug}` },
            ],
          }),
        }}
      />
      <main className="min-h-screen p-6 sm:p-10">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Category: {data.category?.name ?? slug}</h1>
        {categories.length > 0 && (
          <div className="card-base card-glass p-3 mb-6">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Browse categories</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <a key={c.id} href={`/products?categoryId=${c.id}`} className={`text-xs px-2 py-1 rounded-full border`}>{c.name}</a>
              ))}
            </div>
          </div>
        )}
        {data.items.length === 0 ? (
          <p className="text-light-muted dark:text-dark-muted">No products in this category yet.</p>
        ) : (
          <CategoriesClient
            slug={slug}
            initialItems={data.items}
            total={data.total}
            initialTake={take}
          />
        )}
      </div>
      </main>
    </>
  );
}
