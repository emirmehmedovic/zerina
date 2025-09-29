"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";

export default function VendorOverviewPage() {
  const [data, setData] = useState<any>(null);
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
        if (ares.ok) setAnalytics(await ares.json());
        if (cres.ok) { const c = await cres.json(); setStatusCounts(c.counts || {}); }
        if (lres.ok) { const l = await lres.json(); setLowStock(l.items || []); }
      } catch (e: any) {
        setError(e?.message || "Failed to load overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const d = data || {};
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

  if (loading) return <main className="p-6">Loading…</main>;
  if (error) return <main className="p-6 text-sm text-red-600">{error}</main>;

  return (
    <main>
      <Heading className="mb-4">Overview</Heading>
      {!d.shop ? (
        <GlassCard> You don’t have a shop yet. Create one to start selling. </GlassCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatTile label="Products" value={d.productsTotal} />
          <StatTile label="Published" value={d.publishedCount} />
          <StatTile label="Draft" value={d.draftCount} />
          <StatTile label="Low stock (< 5)" value={d.lowStockCount} href="/dashboard/products?lowStock=1&lowStockThreshold=5" />
          <StatTile label="Orders" value={d.ordersTotal} />
          <GlassCard className="md:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Quick links</div>
            <div className="flex flex-wrap gap-3">
              <a className="btn-primary" href="/dashboard/products">Manage products</a>
              <a className="btn-primary" href="/dashboard/products/new">Add product</a>
              <a className="btn-primary" href={`/shops/${d.shop.slug}`}>View my shop</a>
            </div>
          </GlassCard>
          <GlassCard className="relative">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Orders by status</div>
            {Object.keys(statusCounts).length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No data.</div>
            ) : (
              <div className="flex items-center gap-4">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 60 60"
                  onMouseLeave={() => setTip(null)}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
                    setTip((prev) => prev ? { ...prev, x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10 } : null);
                  }}
                >
                  {donut.arcs.map((a) => (
                    <path
                      key={a.k}
                      d={a.d}
                      fill={a.color}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as SVGPathElement).ownerSVGElement!.getBoundingClientRect();
                        setTip({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top + 10, label: `${a.k}: ${statusCounts[a.k] || 0}` });
                      }}
                    />
                  ))}
                </svg>
                <ul className="text-xs space-y-1">
                  {Object.entries(statusCounts).map(([k,v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: (donut.arcs.find(x=>x.k===k)?.color || '#999') }} />
                      <span>{k}</span>
                      <span className="text-light-muted dark:text-dark-muted">{v}</span>
                    </li>
                  ))}
                </ul>
                {tip && (
                  <div
                    className="absolute text-xs px-2 py-1 rounded bg-black/80 text-white pointer-events-none"
                    style={{ left: tip.x, top: tip.y }}
                  >
                    {tip.label}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
          <GlassCard className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-light-muted dark:text-dark-muted">Sales last 30 days</div>
              <div className="text-xs text-light-muted dark:text-dark-muted">Max {(maxVal/100).toFixed(2)} {d.shop?.currency || ''}</div>
            </div>
            {series.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No sales yet.</div>
            ) : (
              <svg width="100%" height="70" viewBox="0 0 284 70" preserveAspectRatio="none">
                <path d={sparkPath} stroke="currentColor" className="text-emerald-500" fill="none" strokeWidth="2" />
              </svg>
            )}
          </GlassCard>
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Top products</div>
            {analytics?.topProducts?.length ? (
              <ul className="text-sm space-y-1">
                {analytics.topProducts.slice(0,5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <a className="underline underline-offset-4" href={`/products/${t.slug}`}>{t.title}</a>
                    <div className="text-xs text-light-muted dark:text-dark-muted">{t.qty} sold · {(t.revenueCents/100).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-light-muted dark:text-dark-muted">No data.</div>
            )}
          </GlassCard>
          <GlassCard className="md:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Low stock (under 5)</div>
            {lowStock.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">All good!</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Product</th>
                    <th className="py-1">Stock</th>
                    <th className="py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-t border-light-glass-border">
                      <td className="py-1 pr-2"><a className="underline underline-offset-4" href={`/products/${p.slug}`}>{p.title}</a></td>
                      <td className="py-1 pr-2">{p.stock}</td>
                      <td className="py-1 pr-2"><a className="underline underline-offset-4" href={`/dashboard/products/${p.id}/edit`}>Edit</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassCard>
        </div>
      )}
    </main>
  );
}
