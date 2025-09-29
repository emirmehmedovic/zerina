"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";

type ProjectionsData = {
  projections: {
    next30Days: {
      orders: number;
      items: number;
      revenueCents: number;
    };
    next90Days: {
      orders: number;
      items: number;
      revenueCents: number;
    };
    next365Days: {
      orders: number;
      items: number;
      revenueCents: number;
    };
    growthRate: number;
  };
  historicalData: {
    days: number;
    totalOrders: number;
    totalItems: number;
    totalRevenueCents: number;
    avgDailyOrders: number;
    avgDailyItems: number;
    avgDailyRevenueCents: number;
  };
};

export default function ProjectionsPage() {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjectionsData | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/analytics/projections?days=${days}`, { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setData(body);
    } catch (e: any) {
      setError(e?.message || 'Failed to load projections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  // Export to CSV
  const exportCSV = () => {
    if (!data) return;
    
    const header = ['period', 'orders', 'items', 'revenue'];
    const rows = [
      ['next30Days', String(data.projections.next30Days.orders), String(data.projections.next30Days.items), String((data.projections.next30Days.revenueCents/100).toFixed(2))],
      ['next90Days', String(data.projections.next90Days.orders), String(data.projections.next90Days.items), String((data.projections.next90Days.revenueCents/100).toFixed(2))],
      ['next365Days', String(data.projections.next365Days.orders), String(data.projections.next365Days.items), String((data.projections.next365Days.revenueCents/100).toFixed(2))],
      ['historical', String(data.historicalData.totalOrders), String(data.historicalData.totalItems), String((data.historicalData.totalRevenueCents/100).toFixed(2))],
    ];
    
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projections-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <Heading>Sales Projections</Heading>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e)=> setDays(Number(e.target.value))} className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm">
            <option value={30}>Based on 30 days</option>
            <option value={90}>Based on 90 days</option>
            <option value={180}>Based on 180 days</option>
            <option value={365}>Based on 365 days</option>
          </select>
          <button onClick={exportCSV} disabled={!data} className="btn-secondary">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <GlassCard>Loading…</GlassCard>
      ) : error ? (
        <GlassCard className="text-sm text-red-600">{error}</GlassCard>
      ) : !data ? (
        <GlassCard>No data available</GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Historical Data ({days} days)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Total Orders</div>
                <div className="text-lg font-semibold">{data.historicalData.totalOrders}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Total Items</div>
                <div className="text-lg font-semibold">{data.historicalData.totalItems}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Total Revenue</div>
                <div className="text-lg font-semibold">{(data.historicalData.totalRevenueCents/100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Growth Rate</div>
                <div className="text-lg font-semibold">{(data.projections.growthRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="lg:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Daily Averages</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Orders/Day</div>
                <div className="text-lg font-semibold">{data.historicalData.avgDailyOrders.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Items/Day</div>
                <div className="text-lg font-semibold">{data.historicalData.avgDailyItems.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Revenue/Day</div>
                <div className="text-lg font-semibold">{(data.historicalData.avgDailyRevenueCents/100).toFixed(2)}</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Next 30 Days</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Orders</div>
                <div className="text-lg font-semibold">{data.projections.next30Days.orders}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Items</div>
                <div className="text-lg font-semibold">{data.projections.next30Days.items}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Revenue</div>
                <div className="text-lg font-semibold">{(data.projections.next30Days.revenueCents/100).toFixed(2)}</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Next 90 Days</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Orders</div>
                <div className="text-lg font-semibold">{data.projections.next90Days.orders}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Items</div>
                <div className="text-lg font-semibold">{data.projections.next90Days.items}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Revenue</div>
                <div className="text-lg font-semibold">{(data.projections.next90Days.revenueCents/100).toFixed(2)}</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Next 365 Days</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Orders</div>
                <div className="text-lg font-semibold">{data.projections.next365Days.orders}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Items</div>
                <div className="text-lg font-semibold">{data.projections.next365Days.items}</div>
              </div>
              <div>
                <div className="text-xs text-light-muted dark:text-dark-muted">Projected Revenue</div>
                <div className="text-lg font-semibold">{(data.projections.next365Days.revenueCents/100).toFixed(2)}</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="lg:col-span-3">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Insights</div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Growth Trend</div>
                <div className="text-sm">
                  {data.projections.growthRate > 0 
                    ? `Your sales are growing at ${(data.projections.growthRate * 100).toFixed(1)}% based on the last ${days} days.`
                    : data.projections.growthRate < 0
                      ? `Your sales are declining at ${Math.abs(data.projections.growthRate * 100).toFixed(1)}% based on the last ${days} days.`
                      : `Your sales are stable based on the last ${days} days.`
                  }
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Recommendations</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {data.projections.growthRate < 0 && (
                    <li>Consider running promotions to reverse the sales decline.</li>
                  )}
                  {data.projections.growthRate > 0.1 && (
                    <li>Your growth is strong. Ensure inventory levels can support projected demand.</li>
                  )}
                  {data.historicalData.avgDailyItems > 0 && (
                    <li>
                      Based on your average daily sales of {data.historicalData.avgDailyItems.toFixed(1)} items, 
                      plan inventory for at least {Math.ceil(data.historicalData.avgDailyItems * 30)} items for the next month.
                    </li>
                  )}
                  <li>Use these projections for financial planning and inventory management.</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
