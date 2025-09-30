"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";

type SeasonalData = {
  seasonal: Array<{
    month: string;
    orders: number;
    items: number;
    revenueCents: number;
  }>;
  weekday: Array<{
    day: number;
    dayName: string;
    orders: number;
    items: number;
    revenueCents: number;
  }>;
};

export default function SeasonalAnalyticsPage() {
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SeasonalData | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/analytics/seasonal?days=${days}`, { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setData(body);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to load seasonal analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  // Export to CSV
  const exportCSV = (type: 'monthly' | 'weekday') => {
    if (!data) return;
    
    if (type === 'monthly') {
      const header = ['month', 'orders', 'items', 'revenue'];
      const rows = data.seasonal.map(s => [
        s.month, 
        String(s.orders), 
        String(s.items),
        String((s.revenueCents/100).toFixed(2))
      ]);
      
      const csv = [header, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      downloadCSV(csv, `seasonal-monthly-${days}days.csv`);
    } else {
      const header = ['day', 'dayName', 'orders', 'items', 'revenue'];
      const rows = data.weekday.map(s => [
        String(s.day),
        s.dayName,
        String(s.orders), 
        String(s.items),
        String((s.revenueCents/100).toFixed(2))
      ]);
      
      const csv = [header, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      downloadCSV(csv, `seasonal-weekday-${days}days.csv`);
    }
  };
  
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate max values for visualization
  const maxMonthlyRevenue = data?.seasonal?.reduce((max, s) => Math.max(max, s.revenueCents), 0) || 1;
  const maxWeekdayRevenue = data?.weekday?.reduce((max, s) => Math.max(max, s.revenueCents), 0) || 1;

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <Heading>Seasonal Analysis</Heading>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e)=> setDays(Number(e.target.value))} className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm">
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>365 days</option>
            <option value={730}>2 years</option>
          </select>
        </div>
      </div>

      {loading ? (
        <GlassCard>Loading…</GlassCard>
      ) : error ? (
        <GlassCard className="text-sm text-red-600">{error}</GlassCard>
      ) : !data ? (
        <GlassCard>No data available</GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-light-muted dark:text-dark-muted">Monthly Performance</div>
              <button onClick={() => exportCSV('monthly')} className="text-xs underline underline-offset-4">Export CSV</button>
            </div>
            {data.seasonal.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No monthly data available.</div>
            ) : (
              <div className="space-y-2">
                {data.seasonal.map((s) => (
                  <div key={s.month} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{s.month}</div>
                      <div className="text-xs text-light-muted dark:text-dark-muted">
                        {s.orders} orders · {s.items} items · {(s.revenueCents/100).toFixed(2)}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-light-glass-border dark:bg-zinc-700/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500/70 rounded-full" 
                        style={{ width: `${Math.max(3, (s.revenueCents / maxMonthlyRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-light-muted dark:text-dark-muted">Day of Week Analysis</div>
              <button onClick={() => exportCSV('weekday')} className="text-xs underline underline-offset-4">Export CSV</button>
            </div>
            {data.weekday.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No weekday data available.</div>
            ) : (
              <div className="space-y-2">
                {data.weekday.map((s) => (
                  <div key={s.day} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{s.dayName}</div>
                      <div className="text-xs text-light-muted dark:text-dark-muted">
                        {s.orders} orders · {s.items} items · {(s.revenueCents/100).toFixed(2)}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-light-glass-border dark:bg-zinc-700/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500/70 rounded-full" 
                        style={{ width: `${Math.max(3, (s.revenueCents / maxWeekdayRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          
          <GlassCard className="lg:col-span-2">
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Insights</div>
            <div className="space-y-3">
              {data.seasonal.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Best Month</div>
                  {(() => {
                    const best = [...data.seasonal].sort((a, b) => b.revenueCents - a.revenueCents)[0];
                    return (
                      <div className="text-sm">
                        {best.month} with {best.orders} orders, {best.items} items, and {(best.revenueCents/100).toFixed(2)} revenue
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {data.weekday.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Best Day of Week</div>
                  {(() => {
                    const best = [...data.weekday].sort((a, b) => b.revenueCents - a.revenueCents)[0];
                    return (
                      <div className="text-sm">
                        {best.dayName} with {best.orders} orders, {best.items} items, and {(best.revenueCents/100).toFixed(2)} revenue
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium">Recommendations</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {data.weekday.length > 0 && (
                    <li>
                      Consider running promotions on {
                        [...data.weekday].sort((a, b) => a.revenueCents - b.revenueCents)[0].dayName
                      } to boost sales on your slowest day.
                    </li>
                  )}
                  {data.seasonal.length > 3 && (
                    <li>
                      Plan inventory for seasonal peaks in {
                        [...data.seasonal].sort((a, b) => b.revenueCents - a.revenueCents)[0].month
                      }.
                    </li>
                  )}
                  <li>Use these patterns to optimize your marketing and inventory planning.</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
