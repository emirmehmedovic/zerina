import { API_URL } from "@/lib/api";
import Link from 'next/link';
import ProductsClient from "./ProductsClient";

type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; shopId: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string };

export default async function ProductsPage({ searchParams }: { searchParams?: { categoryId?: string } }) {
  // Awaiting searchParams to fix the error
  const params = await Promise.resolve(searchParams);
  const categoryId = params?.categoryId || "";
  let items: Product[] = [];
  let total: number = 0;
  let categories: Category[] = [];
  try {
    const url = new URL(`${API_URL}/api/v1/products`);
    url.searchParams.set('take', '12');
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    const [res, resCats] = await Promise.all([
      fetch(url.toString(), { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' }),
    ]);
    if (res.ok) {
      const data = (await res.json()) as { items: Product[]; total?: number };
      items = data.items;
      total = data.total ?? items.length;
    }
    if (resCats.ok) {
      const raw = await resCats.json();
      categories = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Artisan header */}
        <section className="mb-8">
          <div className="rounded-3xl bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 border border-rose-100/60 backdrop-blur-sm shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">
                  Curated collection
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight mb-2">
                  Discover Products
                </h1>
                <p className="text-gray-600 max-w-2xl">
                  Explore handcrafted goods from real makers—gentle colors, thoughtful details, and timeless design.
                </p>
              </div>
              
            </div>
          </div>
        </section>
        
        <ProductsClient 
          initialItems={items} 
          initialTotal={total}
          categories={categories} 
          initialCategoryId={categoryId} 
        />
      </div>
    </main>
  );
}
