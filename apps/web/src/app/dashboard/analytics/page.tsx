"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";
import { API_URL } from "@/lib/api";
import Tabs from '@/components/analytics/Tabs';
import KeyInsights from '@/components/analytics/KeyInsights';
import ProductAnalytics from '@/components/analytics/ProductAnalytics';
import CustomerAnalytics from '@/components/analytics/CustomerAnalytics';
import ProductSelectorForComparison from '@/components/analytics/ProductSelectorForComparison';

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
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to load analytics');
      }
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

  const tabs = [
    {
      id: 'sales',
      label: 'Sales',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatTile label="Revenue" value={`${((kpis?.revenueCents||0)/100).toFixed(2)}`} variant="success" icon={<DollarSign />} />
            <StatTile label="Orders" value={kpis?.orders ?? 0} variant="primary" icon={<ShoppingCart />} />
            <StatTile label="Items Sold" value={kpis?.items ?? 0} variant="default" icon={<Package />} />
            <StatTile label="Avg. Order Value" value={`${((kpis?.avgOrderValueCents||0)/100).toFixed(2)}`} variant="default" icon={<Users />} />
          </div>
          <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Revenue Over Time</h3>
            {series.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-zinc-500">No sales data available.</div>
            ) : (
              <div className="relative h-64">
                <svg width="100%" height="100%" viewBox={`0 0 560 120`} preserveAspectRatio="none">
                   <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={sparkPath.replace(/M(.*?),(.*?) L/, 'M$1,120 L$1,$2 L')} stroke="#10b981" fill="url(#salesGradient)" strokeWidth="2" />
                  <path d={sparkPath} stroke="#10b981" fill="none" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Top Products</h3>
            {topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500">No data.</div>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <Link className="text-zinc-200 hover:text-white transition-colors truncate pr-4" href={`/dashboard/analytics/products/${t.id}`}>{t.title}</Link>
                    <div className="text-zinc-400 font-medium whitespace-nowrap">{t.qty} sold</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    },
    { id: 'products', label: 'Products', content: <ProductAnalytics /> },
    { id: 'customers', label: 'Customers', content: <CustomerAnalytics /> },
    { id: 'compare', label: 'Compare', content: <ProductSelectorForComparison /> },
  ];

  const insights = [
    { text: `You had ${kpis?.orders || 0} orders in the last ${days} days.` },
    { text: `Your top product, '${topProducts[0]?.title || 'N/A'}', generated ${((topProducts[0]?.revenueCents || 0) / 100).toFixed(2)} in revenue.` },
    { text: `Your average order value was ${((kpis?.avgOrderValueCents || 0) / 100).toFixed(2)}.` },
  ];

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400">Your business at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={days} 
            onChange={(e)=> setDays(Number(e.target.value))} 
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 180 Days</option>
          </select>
          <button 
            onClick={exportCSV} 
            disabled={!series.length} 
            className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading analytics...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
      ) : (
        <div>
          <KeyInsights insights={insights} />
          <Tabs tabs={tabs} />
        </div>
      )}
    </main>
  );

}
