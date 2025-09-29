"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

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
    } catch (e: any) {
      setError(e?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => items, [items]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected[r.id]);
  const anySelected = filtered.some((r) => selected[r.id]);
  const selectedIds = filtered.filter((r) => selected[r.id]).map((r) => r.id);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) filtered.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

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


  const onToggleStatus = async (row: Row) => {
    const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setTogglingId(row.id);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: next } : p)));
    } catch {
      // ignore; lightweight control
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search title..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
          />
          <select
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <select
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
          >
            <option value="">All shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
            Low stock
          </label>
          {lowStock && (
            <input
              type="number"
              min={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value) || 1)}
              className="w-20 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm"
              title="Low stock threshold"
            />
          )}
        </div>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <button className="btn-secondary" disabled={!anySelected || !!bulkLoading} onClick={() => bulkSetStatus('PUBLISHED')}>
          {bulkLoading === 'publish' ? 'Publishing…' : 'Publish selected'}
        </button>
        <button className="btn-secondary" disabled={!anySelected || !!bulkLoading} onClick={() => bulkSetStatus('DRAFT')}>
          {bulkLoading === 'draft' ? 'Marking draft…' : 'Mark Draft'}
        </button>
        <button className="btn-danger" disabled={!anySelected || !!bulkLoading} onClick={bulkDelete}>
          {bulkLoading === 'delete' ? 'Deleting…' : 'Delete selected'}
        </button>
        {anySelected && <span className="text-sm text-light-muted dark:text-dark-muted">{selectedIds.length} selected</span>}
      </div>
      {loading ? (
        <div className="card-base card-glass">Loading...</div>
      ) : error ? (
        <div className="card-base card-glass">{error}</div>
      ) : (
        <div className="overflow-x-auto card-base card-glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-2"><input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /></th>
                <th className="py-2">Image</th>
                <th className="py-2">Title</th>
                <th className="py-2">Shop</th>
                <th className="py-2">Price</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-light-glass-border">
                  <td className="py-2 pr-2"><input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))} /></td>
                  <td className="py-2 pr-2">
                    {p.images && p.images.length > 0 ? (
                      <img src={`${API_URL}${p.images[0].storageKey}`} alt={p.title} className="h-12 w-12 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-black/10 dark:bg-white/10" />
                    )}
                  </td>
                  <td className="py-2 pr-2">{p.title}</td>
                  <td className="py-2 pr-2"><a className="underline underline-offset-4" href={`/shops/${p.shop.slug}`}>{p.shop.name}</a></td>
                  <td className="py-2 pr-2">{(p.priceCents/100).toFixed(2)} {p.currency}</td>
                  <td className="py-2 pr-2">{p.stock}</td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => onToggleStatus(p)}
                      disabled={togglingId === p.id}
                      className={`text-xs px-2 py-1 rounded border ${p.status === "PUBLISHED" ? "border-emerald-400/50" : "border-amber-400/50"}`}
                      title="Toggle Draft/Published"
                    >
                      {togglingId === p.id ? "…" : p.status}
                    </button>
                  </td>
                  <td className="py-2 pr-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <a className="underline underline-offset-4" href={`/dashboard/products/${p.id}/edit`}>Edit</a>
                      <a className="underline underline-offset-4" href={`/products/${p.slug}`}>View</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
