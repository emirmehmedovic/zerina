"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";

type VendorOrder = {
  id: string;
  totalCents: number;
  currency: string;
  status: "PENDING_PAYMENT"|"PROCESSING"|"SHIPPED"|"DELIVERED"|"CANCELLED"|"REFUNDED";
  createdAt: string;
  items: { id: string; productId: string; variantId?: string; quantity: number; priceCents: number }[];
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(20);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/v1/vendor/orders`);
      if (status) url.searchParams.set('status', status);
      url.searchParams.set('take', String(take));
      url.searchParams.set('skip', String((page - 1) * take));
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString(), { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setOrders(body.items || []);
      setTotal(body.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!q) return orders;
    const s = q.trim().toLowerCase();
    return orders.filter(o => o.id.toLowerCase().includes(s));
  }, [orders, q]);

  const exportCSV = () => {
    if (orders.length === 0) return;
    const header = [
      'order_id','created_at','status','currency','total_cents','buyer_email','buyer_name',
      `filters:status=${status||'ALL'}`,
      `filters:from=${from||''}`,
      `filters:to=${to||''}`,
      `filters:q=${q||''}`,
      `page:${page}`,
      `take:${take}`
    ];
    const rows: string[][] = [];
    for (const o of filteredOrders) {
      // One row per order; totals aggregated
      rows.push([
        o.id,
        new Date(o.createdAt).toISOString(),
        o.status,
        o.currency,
        String(o.totalCents),
        (o as any).buyer?.email || '',
        (o as any).buyer?.name || ''
      ]);
      // Add item rows as well (prefixed)
      for (const it of o.items || []) {
        rows.push([
          `${o.id}::item`,
          '',
          '',
          o.currency,
          `${it.quantity}x${it.priceCents}`
        ]);
      }
    }
    const csv = [header, ...rows]
      .map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fnStatus = status || 'ALL';
    a.download = `orders_${fnStatus}_${from||'any'}_${to||'any'}_p${page}_t${take}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, take, from, to]);

  const setStatusFor = async (id: string, next: VendorOrder["status"]) => {
    setUpdatingId(id);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    } catch (e: any) {
      alert(e?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const actionsFor = (o: VendorOrder) => {
    const buttons: Array<{ label: string; to: VendorOrder["status"] }> = [];
    if (o.status === 'PENDING_PAYMENT') buttons.push({ label: 'Mark processing', to: 'PROCESSING' });
    if (o.status === 'PROCESSING') buttons.push({ label: 'Mark shipped', to: 'SHIPPED' });
    if (o.status === 'SHIPPED') buttons.push({ label: 'Mark delivered', to: 'DELIVERED' });
    if (o.status !== 'CANCELLED' && o.status !== 'DELIVERED') buttons.push({ label: 'Cancel', to: 'CANCELLED' });
    return buttons;
  };

  return (
    <main>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Shop Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="Search order ID..."
            value={q}
            onChange={(e)=>{ setPage(1); setQ(e.target.value); }}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
          />
          <select className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={from}
            onChange={(e)=>{ setPage(1); setFrom(e.target.value); }}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            title="From date"
          />
          <input
            type="date"
            value={to}
            onChange={(e)=>{ setPage(1); setTo(e.target.value); }}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            title="To date"
          />
          {(from || to || status) && (
            <button className="btn-secondary" onClick={()=>{ setFrom(""); setTo(""); setStatus(""); setPage(1); }}>Clear</button>
          )}
          <button className="btn-secondary" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>
      {loading ? (
        <div className="card-base card-glass p-4">Loading…</div>
      ) : error ? (
        <div className="card-base card-glass p-4 text-red-600 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="card-base card-glass p-4">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <div key={o.id} className="card-base card-glass p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Order #{o.id.slice(0,8)} · <span className="text-light-muted dark:text-dark-muted">{new Date(o.createdAt).toLocaleString()}</span></div>
                <div className="text-sm">{(o.totalCents/100).toFixed(2)} {o.currency}</div>
              </div>
              <div className="text-xs text-light-muted dark:text-dark-muted mt-1">
                Status:
                <span
                  className={
                    "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs border " +
                    (o.status === 'DELIVERED' ? 'border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
                    : o.status === 'SHIPPED' ? 'border-indigo-400/50 text-indigo-700 dark:text-indigo-300'
                    : o.status === 'PROCESSING' ? 'border-blue-400/50 text-blue-700 dark:text-blue-300'
                    : o.status === 'PENDING_PAYMENT' ? 'border-amber-400/50 text-amber-700 dark:text-amber-300'
                    : o.status === 'CANCELLED' ? 'border-rose-400/50 text-rose-700 dark:text-rose-300'
                    : 'border-zinc-400/50 text-zinc-700 dark:text-zinc-300')
                  }
                >
                  {o.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  className="text-xs underline underline-offset-4"
                  onClick={() => setExpandedId((prev) => prev === o.id ? null : o.id)}
                >
                  {expandedId === o.id ? 'Hide details' : 'View details'}
                </button>
              </div>
              {expandedId === o.id && (
                <div className="mt-2 rounded-md border border-light-glass-border bg-white/40 dark:bg-zinc-800/40 p-3">
                  <div className="text-xs text-light-muted dark:text-dark-muted mb-2">Items</div>
                  <ul className="text-sm divide-y divide-light-glass-border">
                    {o.items?.map((it) => (
                      <li key={it.id} className="py-1 flex items-center justify-between">
                        <div>
                          {it.quantity} × <a className="underline underline-offset-4" href={`/dashboard/products/${it.productId}/edit`}>{it.productId}</a>{it.variantId ? ` (variant)` : ''}
                        </div>
                        <div>{(it.priceCents/100).toFixed(2)} {o.currency}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {actionsFor(o).map((a) => (
                  <button key={a.to} className="btn-secondary" disabled={updatingId === o.id} onClick={() => setStatusFor(o.id, a.to)}>
                    {updatingId === o.id ? 'Saving…' : a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-light-muted dark:text-dark-muted">Total: {total}</div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Per page</label>
              <select value={take} onChange={(e) => { setPage(1); setTake(Number(e.target.value)); }} className="border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <button className="btn-secondary" disabled={page===1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
              <div className="text-sm">Page {page}</div>
              <button className="btn-secondary" disabled={(page * take) >= total} onClick={() => setPage((p) => p+1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
