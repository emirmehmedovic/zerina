"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";

type ProductAnalytics = {
  product: {
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    stock: number;
  };
  series: Array<{
    date: string;
    qty: number;
    revenueCents: number;
  }>;
  kpis: {
    totalQty: number;
    totalRevenueCents: number;
    avgOrderValueCents: number;
    daysWithSales: number;
  };
  seasonal: Array<{
    month: string;
    avgQtyPerDay: number;
    avgRevenuePerDay: number;
    totalQty: number;
    totalRevenueCents: number;
  }>;
  projection: {
    next30Days: {
      projectedQty: number;
      projectedRevenueCents: number;
    };
    next90Days: {
      projectedQty: number;
      projectedRevenueCents: number;
    };
  };
};

export default function ProductAnalyticsPage() {
  const { id } = useParams() as { id: string };
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductAnalytics | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/analytics/product/${id}?days=${days}`, { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      if (!body.product) throw new Error('Product not found or not owned by you');
      setData(body);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to load product analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, days]);

  const series = data?.series || [];
  const maxVal = useMemo(() => Math.max(1, ...series.map(s => s.revenueCents)), [series]);
  const sparkPath = useMemo(() => {
    if (series.length === 0) return '';
    const w = 560, h = 120;
    return series.map((s, i) => {
      const x = (i / (series.length - 1)) * (w - 4) + 2;
      const y = h - 2 - (s.revenueCents / maxVal) * (h - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [series, maxVal]);

  // Export to CSV
  const exportCSV = () => {
    if (!data) return;
    
    const header = ['date', 'quantity', 'revenue'];
    const rows = data.series.map(s => [
      s.date, 
      String(s.qty), 
      String((s.revenueCents/100).toFixed(2))
    ]);
    
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-analytics-${data.product.slug}-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/analytics/products" 
            className="p-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <Heading>{data?.product?.title || 'Product Analytics'}</Heading>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={days} 
            onChange={(e)=> setDays(Number(e.target.value))} 
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 text-sm min-w-[120px]"
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>365 days</option>
          </select>
          <button 
            onClick={exportCSV} 
            disabled={!data} 
            className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <GlassCard padded="lg" className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-light-muted dark:text-dark-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading product analytics...</span>
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard padded="lg" className="text-sm text-red-600">{error}</GlassCard>
      ) : !data ? (
        <GlassCard padded="lg">No data available</GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <StatTile label="Total Sold" value={data.kpis.totalQty} />
            <StatTile label="Total Revenue" value={`${(data.kpis.totalRevenueCents/100).toFixed(2)} ${data.product.currency}`} />
            <StatTile label="Avg. Price" value={`${(data.kpis.avgOrderValueCents/100).toFixed(2)} ${data.product.currency}`} />
            <StatTile label="Days with Sales" value={`${data.kpis.daysWithSales} / ${days}`} />
          </div>
          
          <GlassCard className="lg:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Sales over time</div>
            {series.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No sales data available.</div>
            ) : (
              <svg width="100%" height="130" viewBox="0 0 564 130" preserveAspectRatio="none">
                <path d={sparkPath} stroke="currentColor" className="text-emerald-500" fill="none" strokeWidth="2" />
              </svg>
            )}
          </GlassCard>
          
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Seasonal Performance</div>
            {data.seasonal.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No seasonal data available.</div>
            ) : (
              <ul className="text-sm space-y-1">
                {data.seasonal.map((s) => (
                  <li key={s.month} className="flex items-center justify-between">
                    <div>{s.month}</div>
                    <div className="text-xs text-light-muted dark:text-dark-muted">
                      {s.totalQty} sold · {(s.totalRevenueCents/100).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
          
          <GlassCard className="lg:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Projections</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Next 30 Days</div>
                <div className="mt-1 text-sm">
                  <div>Projected Sales: {data.projection.next30Days.projectedQty} units</div>
                  <div>Projected Revenue: {(data.projection.next30Days.projectedRevenueCents/100).toFixed(2)} {data.product.currency}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Next 90 Days</div>
                <div className="mt-1 text-sm">
                  <div>Projected Sales: {data.projection.next90Days.projectedQty} units</div>
                  <div>Projected Revenue: {(data.projection.next90Days.projectedRevenueCents/100).toFixed(2)} {data.product.currency}</div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Current Stock</div>
            <div className="text-2xl font-bold">{data.product.stock}</div>
            {data.product.stock < 10 && (
              <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Low stock! Consider restocking soon.
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Link 
                href={`/dashboard/products/${data.product.id}/edit`} 
                className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
              >
                Edit Product
              </Link>
              <Link 
                href={`/dashboard/analytics/products/compare?ids=${data.product.id}`} 
                className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
              >
                Compare
              </Link>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
