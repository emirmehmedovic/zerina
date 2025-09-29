import { API_URL } from "@/lib/api";

async function getCounts() {
  const [shopsAll, shopsPending, shopsActive, productsAll, lowStock] = await Promise.all([
    fetch(`${API_URL}/api/v1/shops?take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/shops?status=PENDING_APPROVAL&take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/shops?status=ACTIVE&take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/products/admin/list?take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/products/admin/list?q=&take=1`, { cache: "no-store", credentials: "include" })
      .then(r => r.ok ? r.json() : { items: [], total: 0 }).then(data => ({ count: (data.items || []).filter((p: any) => (p.stock ?? 0) < 5).length }))
      .catch(() => ({ count: 0 })),
  ]);
  return {
    shopsTotal: shopsAll.total || 0,
    shopsPending: shopsPending.total || 0,
    shopsActive: shopsActive.total || 0,
    productsTotal: productsAll.total || 0,
    lowStockCount: lowStock.count || 0,
  };
}

export default async function AdminOverviewPage() {
  const counts = await getCounts();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card-base card-glass p-4">
        <div className="text-sm text-light-muted dark:text-dark-muted">Total shops</div>
        <div className="text-2xl font-bold">{counts.shopsTotal}</div>
      </div>
      <div className="card-base card-glass p-4">
        <div className="text-sm text-light-muted dark:text-dark-muted">Pending approval</div>
        <div className="text-2xl font-bold">{counts.shopsPending}</div>
      </div>
      <div className="card-base card-glass p-4">
        <div className="text-sm text-light-muted dark:text-dark-muted">Active shops</div>
        <div className="text-2xl font-bold">{counts.shopsActive}</div>
      </div>
      <div className="card-base card-glass p-4">
        <div className="text-sm text-light-muted dark:text-dark-muted">Total products</div>
        <div className="text-2xl font-bold">{counts.productsTotal}</div>
      </div>
      <a className="card-base card-glass p-4 md:col-span-2 block" href="/admin/inventory?lowStock=1&lowStockThreshold=5">
        <div className="text-sm text-light-muted dark:text-dark-muted">Low stock (example threshold &lt; 5)</div>
        <div className="text-2xl font-bold">{counts.lowStockCount}</div>
      </a>
      <div className="card-base card-glass p-4 md:col-span-2">
        <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Quick links</div>
        <div className="flex flex-wrap gap-3">
          <a className="btn-primary" href="/admin/inventory">Manage inventory</a>
          <a className="btn-primary" href="/admin/products/new">Create product</a>
          <a className="btn-primary" href="/admin/shops">Review shops</a>
        </div>
      </div>
    </div>
  );
}
