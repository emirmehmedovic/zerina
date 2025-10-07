"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, CheckCircle2, FileText, AlertTriangle, ClipboardList, Settings } from "lucide-react";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";

export default function VendorOverviewPage() {
  const [data, setData] = useState<{ shop: { currency: string; slug: string; }; totalRevenueCents: number; ordersTotal: number; publishedCount: number; }>({ shop: { currency: '', slug: '' }, totalRevenueCents: 0, ordersTotal: 0, publishedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ days: number; series: { date: string; totalCents: number }[]; topProducts: { id: string; title: string; slug: string; qty: number; revenueCents: number }[] } | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [tip, setTip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [lowStock, setLowStock] = useState<Array<{ id: string; title: string; slug: string; stock: number }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/overview`, { credentials: "include" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
        setData(body);
        // analytics in parallel
        const [ares, cres, lres] = await Promise.all([
          fetch(`${API_URL}/api/v1/vendor/analytics/sales?days=30`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/vendor/analytics/status-counts`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/vendor/inventory/low-stock?threshold=5&take=10`, { credentials: 'include' }),
        ]);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load overview");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const d = data;
  const series = analytics?.series || [];
  const maxVal = useMemo(() => Math.max(1, ...series.map((s) => s.totalCents)), [series]);
  const sparkPath = useMemo(() => {
    if (series.length === 0) return '';
    const w = 280, h = 60;
    return series
      .map((s, i) => {
        const x = (i / (series.length - 1)) * (w - 4) + 2;
        const y = h - 2 - (s.totalCents / maxVal) * (h - 4);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [series, maxVal]);

  const donut = useMemo(() => {
    const entries = Object.entries(statusCounts);
    const total = Math.max(1, entries.reduce((s, [,v]) => s + (v||0), 0));
    const colors: Record<string, string> = {
      PENDING_PAYMENT: '#f59e0b', PROCESSING: '#3b82f6', SHIPPED: '#8b5cf6', DELIVERED: '#10b981', CANCELLED: '#ef4444', REFUNDED: '#6b7280'
    };
    let acc = 0;
    const r = 26;
    const cx = 30, cy = 30;
    const arcs = entries.map(([k, v]) => {
      const val = v || 0;
      const start = acc / total * Math.PI * 2;
      acc += val;
      const end = acc / total * Math.PI * 2;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      const large = end - start > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return { k, d, color: colors[k] || '#999' };
    });
    return { arcs, total };
  }, [statusCounts]);

  if (loading) return <main className="min-h-screen p-6 sm:p-10">Loading…</main>;
  if (error) return <main className="min-h-screen p-6 sm:p-10 text-sm text-red-600">{error}</main>;

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Enhanced header */}
        <div className="mb-8 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-400 via-zinc-300 to-transparent rounded-full" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-zinc-900 dark:text-zinc-100 tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-base flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            Quick snapshot of your shop performance
          </p>
        </div>

        {!d.shop ? (
          <GlassCard> You don’t have a shop yet. Create one to start selling. </GlassCard>
        ) : (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatTile label="Total Revenue" value={`${((d.totalRevenueCents || 0) / 100).toFixed(2)} ${d.shop?.currency || ''}`} variant="success" icon={<CheckCircle2 className="h-4 w-4" />} />
              <StatTile label="Total Orders" value={d.ordersTotal} variant="primary" icon={<ClipboardList className="h-4 w-4" />} href="/dashboard/orders" />
              <StatTile label="Published Products" value={d.publishedCount} variant="default" icon={<Package className="h-4 w-4" />} href="/dashboard/products" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sales Chart */}
                <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm uppercase tracking-wider text-zinc-400">Sales Last 30 Days</h3>
                    <div className="text-xs text-zinc-400">Max: <span className="font-semibold text-white">{(maxVal/100).toFixed(2)} {d.shop?.currency || ''}</span></div>
                  </div>
                  {series.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-zinc-500">No sales data available.</div>
                  ) : (
                    <div className="relative h-48">
                      <svg width="100%" height="100%" viewBox="0 0 284 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={sparkPath.replace(/M(.*?),(.*?) L/, 'M$1,160 L$1,$2 L')} stroke="#10b981" fill="url(#salesGradient)" strokeWidth="2.5" />
                        <path d={sparkPath} stroke="#10b981" fill="none" strokeWidth="2.5" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Quick Links */}
                <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
                  <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Quick Links</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <a href="/dashboard/products" className="group flex items-center gap-3 rounded-xl p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:-translate-y-1">
                      <Package className="h-6 w-6 text-blue-400" />
                      <span className="font-semibold text-white">Manage Products</span>
                    </a>
                    <a href="/dashboard/products/new" className="group flex items-center gap-3 rounded-xl p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:-translate-y-1">
                      <FileText className="h-6 w-6 text-emerald-400" />
                      <span className="font-semibold text-white">Add Product</span>
                    </a>
                    <a href={`/shops/${d.shop.slug}`} className="group flex items-center gap-3 rounded-xl p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:-translate-y-1">
                      <Settings className="h-6 w-6 text-purple-400" />
                      <span className="font-semibold text-white">View My Shop</span>
                    </a>
                    <a href="/dashboard/blog" className="group flex items-center gap-3 rounded-xl p-4 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:-translate-y-1">
                      <FileText className="h-6 w-6 text-amber-300" />
                      <span className="font-semibold text-white">Write a Blog</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Orders by Status */}
                <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
                  <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Orders by Status</h3>
                  {Object.keys(statusCounts).length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">No data.</div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <svg width="140" height="140" viewBox="0 0 60 60">
                          {donut.arcs.map((a) => (
                            <path key={a.k} d={a.d} fill={a.color} />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-white">{donut.total}</span>
                          <span className="text-xs text-zinc-400">Total Orders</span>
                        </div>
                      </div>
                      <ul className="w-full space-y-2 text-sm">
                        {Object.entries(statusCounts).map(([k,v]) => (
                          <li key={k} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: (donut.arcs.find(x=>x.k===k)?.color || '#999') }} />
                              <span className="text-zinc-300">{k}</span>
                            </div>
                            <span className="font-semibold text-white">{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {/* Low Stock */}
                <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
                  <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Low Stock Items</h3>
                  {lowStock.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">All products are well-stocked.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                          <th className="py-2 font-medium">Product</th>
                          <th className="py-2 font-medium text-center">Stock</th>
                          <th className="py-2 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.map((p) => (
                          <tr key={p.id} className="border-t border-white/10">
                            <td className="py-3 pr-2 text-zinc-200 hover:text-white transition-colors"><a href={`/products/${p.slug}`}>{p.title}</a></td>
                            <td className="py-3 pr-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock < 3 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <a className="text-blue-400 hover:text-blue-300 font-semibold" href={`/dashboard/products/${p.id}/edit`}>Manage</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
