"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Search, Edit, Eye, Trash2 } from 'lucide-react';
import Image from 'next/image';

type Row = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  stock: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
  createdAt: string;
  shop: { id: string; name: string; slug: string };
  images?: { storageKey: string }[];
};

type Shop = { id: string; name: string; slug: string; status: string };

export default function AdminInventoryPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState<null | 'publish' | 'draft' | 'delete'>(null);
  const [lowStock, setLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/v1/products/admin/list`);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      if (shopId) url.searchParams.set("shopId", shopId);
      if (lowStock) {
        url.searchParams.set("lowStock", "1");
        url.searchParams.set("lowStockThreshold", String(lowStockThreshold));
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => items, [items]);

  const anySelected = filtered.some((r) => selected[r.id]);
  const selectedIds = filtered.filter((r) => selected[r.id]).map((r) => r.id);

  const bulkSetStatus = async (status: 'PUBLISHED' | 'DRAFT') => {
    if (!anySelected) return;
    setBulkLoading(status === 'PUBLISHED' ? 'publish' : 'draft');
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_URL}/api/v1/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status }),
          })
        )
      );
      setItems((prev) => prev.map((r) => (selected[r.id] ? { ...r, status } as Row : r)));
      setSelected({});
    } finally {
      setBulkLoading(null);
    }
  };

  const bulkDelete = async () => {
    if (!anySelected) return;
    if (!confirm(`Delete ${selectedIds.length} product(s)?`)) return;
    setBulkLoading('delete');
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_URL}/api/v1/products/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
      );
      setItems((prev) => prev.filter((r) => !selected[r.id]));
      setSelected({});
    } finally {
      setBulkLoading(null);
    }
  };

  const loadShops = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/shops?take=500`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setShops(data.items || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    // Initialize from query params once
    const ls = search.get('lowStock');
    const thr = search.get('lowStockThreshold');
    if (ls) setLowStock(true);
    if (thr) setLowStockThreshold(Number(thr) || 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, shopId, lowStock, lowStockThreshold]);


  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Control</h1>
          <p className="text-zinc-400">Monitor and manage all product inventory.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search by product title..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Shops</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-zinc-500">Loading inventory...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="group grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="col-span-1">
                <input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))} className="form-checkbox h-4 w-4 bg-transparent border-zinc-600 text-blue-500 focus:ring-blue-500" />
              </div>
              <div className="col-span-1">
                {p.images && p.images.length > 0 ? (
                  <Image src={`${API_URL}${p.images[0].storageKey}`} alt={p.title} width={56} height={56} className="h-14 w-14 object-cover rounded-lg" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-black/20" />
                )}
              </div>
              <div className="col-span-4">
                <a href={`/products/${p.slug}`} className="font-semibold text-white hover:text-blue-400 transition-colors">{p.title}</a>
                <div className="text-xs text-zinc-500">from <a href={`/shops/${p.shop.slug}`} className="hover:text-zinc-300">{p.shop.name}</a></div>
              </div>
              <div className="col-span-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${p.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>{p.status}</span>
              </div>
              <div className="col-span-2 text-zinc-300">
                <span className={p.stock < lowStockThreshold ? 'text-amber-400 font-bold' : ''}>{p.stock}</span> in stock
              </div>
              <div className="col-span-1 font-semibold text-white">
                ${(p.priceCents / 100).toFixed(2)}
              </div>
              <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`/dashboard/products/${p.id}/edit`} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Edit size={16} /></a>
                <a href={`/products/${p.slug}`} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Eye size={16} /></a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
