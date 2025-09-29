import { API_URL } from "@/lib/api";
import ProductsClient from "./ProductsClient";

type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; shopId: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string };

export default async function ProductsPage({ searchParams }: { searchParams?: { categoryId?: string } }) {
  // Awaiting searchParams to fix the error
  const params = await Promise.resolve(searchParams);
  const categoryId = params?.categoryId || "";
  let items: Product[] = [];
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
      const data = (await res.json()) as { items: Product[] };
      items = data.items;
    }
    if (resCats.ok) {
      const raw = await resCats.json();
      categories = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>
        <ProductsClient 
          initialItems={items} 
          categories={categories} 
          initialCategoryId={categoryId} 
        />
      </div>
    </main>
  );
}
