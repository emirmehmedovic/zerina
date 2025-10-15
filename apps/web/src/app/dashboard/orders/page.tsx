"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, ChevronDown, Printer } from 'lucide-react';
import { imageUrl } from "@/lib/imageUrl";

type VendorOrderItem = {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  priceCents: number;
  product?: {
    title: string;
    slug: string;
    images?: { storageKey: string }[];
  } | null;
  variant?: {
    id: string;
    attributes: Record<string, unknown> | null;
  } | null;
};

type VendorOrder = {
  id: string;
  totalCents: number;
  currency: string;
  status: "PENDING_PAYMENT"|"PROCESSING"|"SHIPPED"|"DELIVERED"|"CANCELLED"|"REFUNDED";
  createdAt: string;
  items: VendorOrderItem[];
  buyer?: { email: string; name: string };
  shippingAddress?: OrderAddress | null;
  billingAddress?: OrderAddress | null;
};

type OrderAddress = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
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
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to load orders');
      }
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
        o.buyer?.email || '',
        o.buyer?.name || ''
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
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('Failed to update status');
      }
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

  const renderAddress = (label: string, address?: OrderAddress | null) => {
    if (!address) return (
      <div className="rounded-xl bg-black/10 border border-white/10 p-4">
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
        <div className="text-sm text-zinc-400">No address on file.</div>
      </div>
    );
    return (
      <div className="rounded-xl bg-black/10 border border-white/10 p-4">
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
        <div className="text-sm text-zinc-200 space-y-1">
          <div>{address.street}</div>
          <div>{address.postalCode} {address.city}</div>
          <div>{address.country}</div>
        </div>
      </div>
    );
  };

  const formatMoney = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`;

  const variantSummary = (variant?: VendorOrderItem["variant"]) => {
    if (!variant?.attributes || typeof variant.attributes !== 'object') return null;
    return Object.entries(variant.attributes)
      .filter(([key]) => key !== '__typename')
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');
  };

  const printPackingSlip = (order: VendorOrder) => {
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow pop-ups to print the packing slip.');
      return;
    }

    const addressLines = (address?: OrderAddress | null) => {
      if (!address) return '<em>No address on file</em>';
      return [address.street, `${address.postalCode} ${address.city}`, address.country]
        .filter(Boolean)
        .map((line) => `<div>${line}</div>`) 
        .join('');
    };

    const itemsRows = order.items.map((item, idx) => {
      const imgKey = item.product?.images?.[0]?.storageKey;
      const variant = variantSummary(item.variant) || '';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div><strong>${item.product?.title || 'Product ' + item.productId.slice(0, 8)}</strong></div>
            ${variant ? `<div class="variant">${variant}</div>` : ''}
            <div class="meta">Product ID: ${item.productId}</div>
            ${item.variantId ? `<div class="meta">Variant ID: ${item.variantId}</div>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>${formatMoney(item.priceCents, order.currency)}</td>
          <td>${formatMoney(item.priceCents * item.quantity, order.currency)}</td>
        </tr>
      `;
    }).join('');

    win.document.write(`
      <html>
        <head>
          <title>Packing slip #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; vertical-align: top; }
            th { background: #f7f7f7; text-align: left; }
            .section { margin-top: 16px; }
            .meta { color: #666; font-size: 11px; }
            .label { font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: .6px; margin-bottom: 4px; }
            .address-box { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Packing slip</h1>
          <div class="meta">Order ID: ${order.id}</div>
          <div class="meta">Placed: ${new Date(order.createdAt).toLocaleString()}</div>
          <div class="meta">Status: ${order.status.replace(/_/g, ' ')}</div>

          <div class="section" style="display:flex; gap:16px;">
            <div style="flex:1;" class="address-box">
              <div class="label">Ship to</div>
              ${addressLines(order.shippingAddress)}
            </div>
            <div style="flex:1;" class="address-box">
              <div class="label">Bill to</div>
              ${addressLines(order.billingAddress)}
            </div>
          </div>

          <div class="section address-box">
            <div class="label">Customer</div>
            <div>${order.buyer?.name || 'Unknown customer'}</div>
            <div class="meta">${order.buyer?.email || 'No email on file'}</div>
          </div>

          <table class="section">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="section" style="text-align:right; font-weight:600;">
            Total: ${formatMoney(order.totalCents, order.currency)}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
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
          {filteredOrders.map((o) => {
            const isExpanded = expandedId === o.id;
            return (
              <div
                key={o.id}
                className={`rounded-2xl bg-black/20 transition-colors hover:bg-black/30 border ${isExpanded ? 'border-emerald-400/70 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]' : 'border-white/10'}`}
              >
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}>
                <div className="grid grid-cols-10 items-center gap-4">
                  <div className="col-span-3">
                    <div className="font-mono text-xs text-zinc-500">#{o.id}</div>
                    <div className="font-semibold text-white">{o.buyer?.name || 'Unknown Customer'}</div>
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
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-black/10 border border-white/10 p-4">
                          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Customer</div>
                          <div className="text-sm text-zinc-200 space-y-1">
                            <div>{o.buyer?.name || 'Unknown customer'}</div>
                            <div className="text-zinc-400">{o.buyer?.email || 'No email provided'}</div>
                            <div className="text-xs text-zinc-500">Placed {new Date(o.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        {renderAddress('Shipping address', o.shippingAddress)}
                        {renderAddress('Billing address', o.billingAddress)}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-300 mb-2">Items</h4>
                        <ul className="text-sm divide-y divide-white/10">
                          {o.items?.map((it) => (
                            <li key={it.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                {it.product?.images?.[0]?.storageKey ? (
                                  <img
                                    src={imageUrl(it.product.images[0].storageKey)}
                                    alt={it.product?.title || 'Product image'}
                                    className="h-12 w-12 rounded-md object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-md border border-dashed border-white/10 flex items-center justify-center text-[11px] text-zinc-500">No image</div>
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-zinc-100">
                                    {it.product?.title || `Product ${it.productId.slice(0, 8)}`}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    Product ID: {it.productId}
                                  </div>
                                  {it.variantId && (
                                    <div className="text-xs text-zinc-500">
                                      Variant: {it.variantId}
                                    </div>
                                  )}
                                  {variantSummary(it.variant) && (
                                    <div className="text-xs text-zinc-400 mt-1">{variantSummary(it.variant)}</div>
                                  )}
                                  <a
                                    className="mt-1 inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                                    href={`/dashboard/products/${it.productId}/edit`}
                                  >
                                    View product details
                                  </a>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-sm text-zinc-300">Qty: {it.quantity}</div>
                                <div className="font-mono text-zinc-400">Unit: {formatMoney(it.priceCents, o.currency)}</div>
                                <div className="font-semibold text-zinc-100">Subtotal: {formatMoney(it.priceCents * it.quantity, o.currency)}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => printPackingSlip(o)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-100 hover:bg-white/20"
                        >
                          <Printer className="h-3.5 w-3.5" /> Print packing slip
                        </button>
                        <h4 className="text-sm font-semibold text-zinc-300">Status actions:</h4>
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
            );
          })}
        </div>
      )}
    </main>
  );
}
