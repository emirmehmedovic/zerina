"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";
import { API_URL } from "@/lib/api";

export default function VendorAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<{ revenueCents: number; orders: number; items: number; avgOrderValueCents: number } | null>(null);
  const [series, setSeries] = useState<{ date: string; totalCents: number }[]>([]);
  const [topProducts, setTopProducts] = useState<Array<{ id: string; title: string; slug: string; qty: number; revenueCents: number }>>([]);
  const [topCustomers, setTopCustomers] = useState<Array<{ buyerId: string; revenueCents: number }>>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kres, sres, pres, cres] = await Promise.all([
        fetch(`${API_URL}/api/v1/vendor/analytics/kpis?days=${days}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/vendor/analytics/sales?days=${days}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/vendor/analytics/top-products?limit=10&days=${days}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/vendor/analytics/top-customers?limit=10&days=${days}`, { credentials: 'include' }),
      ]);
      if (kres.ok) { const b = await kres.json(); setKpis(b); }
      if (sres.ok) { const b = await sres.json(); setSeries(b.series || []); }
      if (pres.ok) { const b = await pres.json(); setTopProducts(b.items || []); }
      if (cres.ok) { const b = await cres.json(); setTopCustomers(b.items || []); }
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  const maxVal = useMemo(() => Math.max(1, ...series.map(s => s.totalCents)), [series]);
  const sparkPath = useMemo(() => {
    if (series.length === 0) return '';
    const w = 560, h = 120;
    return series.map((s, i) => {
      const x = (i / (series.length - 1)) * (w - 4) + 2;
      const y = h - 2 - (s.totalCents / maxVal) * (h - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [series, maxVal]);
  
  // Export to CSV
  const exportCSV = () => {
    if (!series.length) return;
    
    const header = ['date', 'revenue'];
    const rows = series.map(s => [s.date, (s.totalCents/100).toFixed(2)]);
    
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <Heading>Analytics</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-light-muted dark:text-dark-muted">Range</label>
          <select 
            value={days} 
            onChange={(e)=> setDays(Number(e.target.value))} 
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 text-sm min-w-[120px]"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
          <button 
            onClick={exportCSV} 
            disabled={!series.length} 
            className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <GlassCard className="mb-6" variant="subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm font-medium">Detailed Analytics</div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/dashboard/analytics/products" 
              className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
            >
              Product Analytics
            </Link>
            <Link 
              href="/dashboard/analytics/seasonal" 
              className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
            >
              Seasonal Analysis
            </Link>
            <Link 
              href="/dashboard/analytics/projections" 
              className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
            >
              Projections
            </Link>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard padded="lg" className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-light-muted dark:text-dark-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading analytics...</span>
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard padded="lg" className="text-sm text-red-600">{error}</GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:gap-4">
            <StatTile label="Revenue" value={`${((kpis?.revenueCents||0)/100).toFixed(2)}`} />
            <StatTile label="Orders" value={kpis?.orders ?? 0} />
            <StatTile label="Items sold" value={kpis?.items ?? 0} />
            <StatTile label="Avg. order" value={`${((kpis?.avgOrderValueCents||0)/100).toFixed(2)}`} />
          </div>
          
          <GlassCard className="lg:col-span-2" variant="default">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-light-ink dark:text-white">Revenue over time</div>
              <div className="text-xs text-light-muted dark:text-dark-muted">{days} days</div>
            </div>
            {series.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-light-muted dark:text-dark-muted">No data available.</div>
            ) : (
              <div className="mt-2">
                <svg width="100%" height="130" viewBox="0 0 564 130" preserveAspectRatio="none">
                  <path d={sparkPath} stroke="currentColor" className="text-emerald-500" fill="none" strokeWidth="2" />
                </svg>
              </div>
            )}
          </GlassCard>
          
          <GlassCard className="h-full flex flex-col" variant="default">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-light-ink dark:text-white">Top products</div>
              <Link href="/dashboard/analytics/products" className="text-xs text-light-muted dark:text-dark-muted hover:underline">View all</Link>
            </div>
            {topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-light-muted dark:text-dark-muted">No data available.</div>
            ) : (
              <ul className="text-sm space-y-2 mt-1 flex-grow">
                {topProducts.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-1 border-b border-light-glass-border last:border-0">
                    <Link className="hover:underline truncate max-w-[70%]" href={`/dashboard/analytics/products/${t.id}`}>{t.title}</Link>
                    <div className="text-xs text-light-muted dark:text-dark-muted whitespace-nowrap">{t.qty} · {((t.revenueCents/100)).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-3 border-t border-light-glass-border">
              <Link 
                href="/dashboard/analytics/products/compare" 
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 18 23 12 17 6"></polyline>
                  <polyline points="7 6 1 12 7 18"></polyline>
                </svg>
                Compare Products
              </Link>
            </div>
          </GlassCard>
          
          <GlassCard className="h-full flex flex-col" variant="default">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-light-ink dark:text-white">Top customers</div>
              <div className="text-xs text-light-muted dark:text-dark-muted">{topCustomers.length} total</div>
            </div>
            {topCustomers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-light-muted dark:text-dark-muted">No data available.</div>
            ) : (
              <ul className="text-sm space-y-2 mt-1 flex-grow">
                {topCustomers.map((c) => (
                  <li key={c.buyerId} className="flex items-center justify-between py-1 border-b border-light-glass-border last:border-0">
                    <div className="font-mono text-xs bg-light-glass-border dark:bg-zinc-800/50 px-2 py-1 rounded">{c.buyerId.slice(0,8)}</div>
                    <div className="text-xs text-light-muted dark:text-dark-muted">{((c.revenueCents/100)).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}
    </main>
  );
}
