import { API_URL } from "@/lib/api";
import StatTile from '@/components/ui/StatTile';
import { Store, CheckCircle, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Product = {
  stock?: number;
};

async function getCounts() {
  const [shopsAll, shopsPending, shopsActive, productsAll, lowStock] = await Promise.all([
    fetch(`${API_URL}/api/v1/shops?take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/shops?status=PENDING_APPROVAL&take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/shops?status=ACTIVE&take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/products/admin/list?take=1`, { cache: "no-store", credentials: "include" }).then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    fetch(`${API_URL}/api/v1/products/admin/list?q=&take=1`, { cache: "no-store", credentials: "include" })
      .then(r => r.ok ? r.json() : { items: [], total: 0 }).then(data => ({ count: (data.items || []).filter((p: Product) => (p.stock ?? 0) < 5).length }))
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile label="Total Shops" value={counts.shopsTotal} icon={<Store />} />
        <StatTile label="Pending Approval" value={counts.shopsPending} icon={<CheckCircle />} />
        <StatTile label="Total Products" value={counts.productsTotal} icon={<Package />} />
        <StatTile label="Low Stock Items" value={counts.lowStockCount} icon={<AlertTriangle />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/inventory" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 transition-colors">
              Manage Inventory <ArrowRight size={16} />
            </Link>
            <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 transition-colors">
              Create Product <ArrowRight size={16} />
            </Link>
            <Link href="/admin/shops" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 transition-colors">
              Review Shops <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-600/20 backdrop-blur-md border border-red-500/30 p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-2">System Status</h3>
          <p className="text-red-300/80">All systems operational.</p>
        </div>
      </div>
    </div>
  );
}
