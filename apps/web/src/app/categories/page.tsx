import { Suspense } from 'react';
import CategoriesPageClient from './CategoriesPageClient';
import { API_URL } from '@/lib/api';

type Category = { id: string; name: string; parentId?: string | null; slug?: string };

export default async function CategoriesPage() {
  let items: Category[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' });
    if (res.ok) {
      const raw = await res.json();
      const base = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      items = base.map((c: { id: string; name: string; parentId?: string | null; slug?: string }) => ({ id: c.id, name: c.name, parentId: c.parentId ?? null, slug: c.slug || c.name?.toLowerCase?.().replace(/[^a-z0-9]+/g,'-') }));
    }
  } catch {}

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesPageClient items={items} />
    </Suspense>
  );
}
