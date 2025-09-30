"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, ChevronDown } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Hub</h1>
          <p className="text-zinc-400">Manage and track all customer orders.</p>
        </div>
        <button className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-sm text-zinc-200 hover:bg-white/5 transition-colors" onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search by Order ID or customer..."
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="lg:col-span-2 flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className="w-full border border-white/10 rounded-lg px-3 py-2 bg-black/20 text-zinc-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <span className="text-zinc-500">to</span>
            <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className="w-full border border-white/10 rounded-lg px-3 py-2 bg-black/20 text-zinc-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-zinc-500">Loading orders...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center p-10 rounded-2xl bg-black/20 border border-white/10 text-zinc-500">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-black/20 border border-white/10 transition-colors hover:bg-black/30">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}>
                <div className="grid grid-cols-10 items-center gap-4">
                  <div className="col-span-3">
                    <div className="font-mono text-xs text-zinc-500">#{o.id}</div>
                    <div className="font-semibold text-white">{(o as any).buyer?.name || 'Unknown Customer'}</div>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="col-span-3 text-sm text-zinc-400">
                    {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="col-span-1 text-right font-semibold text-white">
                    ${(o.totalCents / 100).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-end items-center">
                    <motion.div animate={{ rotate: expandedId === o.id ? 180 : 0 }}><ChevronDown size={20} className="text-zinc-500" /></motion.div>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {expandedId === o.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-300 mb-2">Items</h4>
                        <ul className="text-sm divide-y divide-white/10">
                          {o.items?.map((it) => (
                            <li key={it.id} className="py-2 flex items-center justify-between">
                              <div>
                                {it.quantity} × <a className="underline hover:text-blue-400" href={`/dashboard/products/${it.productId}/edit`}>Product #{it.productId.slice(0, 8)}...</a>
                              </div>
                              <div className="font-mono text-zinc-400">${(it.priceCents / 100).toFixed(2)}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <h4 className="text-sm font-semibold text-zinc-300">Actions:</h4>
                        {actionsFor(o).map((a) => (
                          <button key={a.to} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors" disabled={updatingId === o.id} onClick={() => setStatusFor(o.id, a.to)}>
                            {updatingId === o.id ? 'Saving…' : a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
