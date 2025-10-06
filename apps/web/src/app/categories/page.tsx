import { Suspense } from 'react';
import CategoriesPageClient from './CategoriesPageClient';
import { API_URL } from '@/lib/api';

type Category = { id: string; name: string; parentId?: string | null; slug?: string };
type Product = { id: string; title: string; images?: { storageKey: string }[] };

export default async function CategoriesPage() {
  let items: Category[] = [];
  let latestProducts: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' });
    if (res.ok) {
      const raw = await res.json();
      const base = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      items = base.map((c: { id: string; name: string; parentId?: string | null; slug?: string }) => ({ id: c.id, name: c.name, parentId: c.parentId ?? null, slug: c.slug || c.name?.toLowerCase?.().replace(/[^a-z0-9]+/g,'-') }));
    }
    const pr = await fetch(`${API_URL}/api/v1/products?latest=true&take=20`, { cache: 'no-store' });
    if (pr.ok) {
      const pdata = await pr.json();
      latestProducts = Array.isArray(pdata?.items) ? pdata.items : Array.isArray(pdata) ? pdata : [];
    }
  } catch {}

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesPageClient items={items} latestProducts={latestProducts} />
    </Suspense>
  );
}
