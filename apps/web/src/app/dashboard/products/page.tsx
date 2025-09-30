"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { useToast } from "@/components/ToastProvider";
import { Plus, Search, Edit, Trash2, Archive, Eye } from 'lucide-react';

type Product = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  stock: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
  images?: { storageKey: string }[];
};

export default function DashboardProductsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: keyof Product | "price"; dir: "asc" | "desc" }>({ key: "title", dir: "asc" });
  const [status, setStatus] = useState<string>("");
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [lowStock, setLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState<null | 'publish' | 'draft' | 'delete'>(null);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(20);
  const [total, setTotal] = useState(0);
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const formatNumber = (val: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const parsePriceToCents = (raw: string, fallbackCents: number) => {
    if (!raw) return fallbackCents;
    let s = raw.trim();
    // Replace non-breaking spaces
    s = s.replace(/\u00A0/g, ' ');
    // If both comma and dot present, assume the last occurrence is decimal separator
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let decimalChar = '.';
    if (lastComma > lastDot) decimalChar = ',';
    // Remove all non-digits and non-decimalChar
    const allowed = new RegExp(`[^0-9${decimalChar === '.' ? '\\.' : ','}]`, 'g');
    s = s.replace(allowed, '');
    // Remove thousands separators: all occurrences of the other char
    if (decimalChar === ',') s = s.replace(/\./g, ''); else s = s.replace(/,/g, '');
    // Normalize decimalChar to '.'
    if (decimalChar === ',') s = s.replace(/,/g, '.');
    const num = parseFloat(s);
    if (!Number.isFinite(num)) return fallbackCents;
    return Math.round(num * 100);
  };

  const load = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/v1/vendor/products`);
      if (query) url.searchParams.set('q', query);
      const effStatus = archivedOnly ? 'ARCHIVED' : status;
      if (effStatus) url.searchParams.set('status', effStatus);
      if (lowStock) {
        url.searchParams.set('lowStock', '1');
        url.searchParams.set('lowStockThreshold', String(lowStockThreshold));
      }
      url.searchParams.set('take', String(take));
      url.searchParams.set('skip', String((page - 1) * take));
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = [
      'id','title','slug','priceCents','currency','stock','status',
      `filters:q=${query}`,
      `filters:status=${status|| (archivedOnly ? 'ARCHIVED' : '')}`,
      `filters:lowStock=${lowStock?'1':'0'}`,
      `filters:lowStockThreshold=${lowStock?lowStockThreshold:''}`,
      `page:${page}`,
      `take:${take}`
    ];
    const rows = sorted.map((p) => [p.id, p.title, p.slug, String(p.priceCents), p.currency, String(p.stock), p.status]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fnStatus = status || (archivedOnly ? 'ARCHIVED' : 'ALL');
    a.download = `products_${fnStatus}_${lowStock?`low-${lowStockThreshold}`:'all'}_p${page}_t${take}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onArchiveSingle = async (p: Product) => {
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'ARCHIVED' } : x)));
      push({ type: 'success', title: 'Archived', message: `${p.title} archived.` });
    } catch (e: any) {
      push({ type: 'error', title: 'Archive failed', message: e?.message || 'Unknown error' });
    }
  };

  const onUpdateField = async (p: Product, patch: Partial<Pick<Product, 'priceCents' | 'stock' | 'status'>>) => {
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    } catch (e: any) {
      push({ type: 'error', title: 'Update failed', message: e?.message || 'Unknown error' });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, archivedOnly, lowStock, lowStockThreshold, page, take]);

  // Clear selection when items change
  useEffect(() => {
    setSelected({});
  }, [items]);

  const onToggleStatus = async (p: Product) => {
    const next = p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", 'X-CSRF-Token': csrf },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
      push({ type: "success", title: "Status updated", message: `${p.title} → ${next}` });
    } catch (err: any) {
      push({ type: "error", title: "Update failed", message: err?.message || "Unknown error" });
    }
  };

  const filtered = items.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every((r) => selected[r.id]);
  const anySelected = filtered.some((r) => selected[r.id]);
  const selectedIds = filtered.filter((r) => selected[r.id]).map((r) => r.id);
  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    switch (sort.key) {
      case "price":
        return ((a.priceCents || 0) - (b.priceCents || 0)) * dir;
      case "stock":
        return ((a.stock || 0) - (b.stock || 0)) * dir;
      case "status":
        return a.status.localeCompare(b.status) * dir;
      case "title":
      default:
        return a.title.localeCompare(b.title) * dir;
    }
  });

  const setSortKey = (key: typeof sort.key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: "DELETE",
        headers: { 'X-CSRF-Token': csrf },
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      push({ type: "success", title: "Deleted", message: "Product removed." });
      await load();
    } catch (err: any) {
      push({ type: "error", title: "Delete failed", message: err.message || "Unknown error" });
    }
  };

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) filtered.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

  const bulkSetStatus = async (next: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    if (selectedIds.length === 0) return;
    setBulkLoading(next === 'PUBLISHED' ? 'publish' : next === 'DRAFT' ? 'draft' : 'delete');
    try {
      const csrf = await getCsrfToken();
      await Promise.all(selectedIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
          credentials: 'include',
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed (${res.status})`);
        }
      }));
      push({ type: 'success', title: 'Updated', message: `Set ${selectedIds.length} to ${next}` });
      setSelected({});
      await load();
    } catch (e: any) {
      push({ type: 'error', title: 'Bulk failed', message: e?.message || 'Unknown error' });
    } finally {
      setBulkLoading(null);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} products?`)) return;
    setBulkLoading('delete');
    try {
      const csrf = await getCsrfToken();
      await Promise.all(selectedIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/v1/products/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrf }, credentials: 'include' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed (${res.status})`);
        }
      }));
      push({ type: 'success', title: 'Deleted', message: `Removed ${selectedIds.length} products` });
      setSelected({});
      await load();
    } catch (e: any) {
      push({ type: 'error', title: 'Bulk delete failed', message: e?.message || 'Unknown error' });
    } finally {
      setBulkLoading(null);
    }
  };

  const StatusBadge = ({ status }: { status: Product['status'] }) => {
    const statusStyles: Record<Product['status'], string> = {
      PUBLISHED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      DRAFT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      SUSPENDED: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[status]}`}>{status}</span>;
  };

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Command Center</h1>
          <p className="text-zinc-400">Manage your entire product catalog.</p>
        </div>
        <a href="/dashboard/products/new" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
          <Plus size={18} />
          Add Product
        </a>
      </div>

      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="form-checkbox h-4 w-4 bg-transparent border-zinc-600 text-blue-500 focus:ring-blue-500" />
              Low Stock
            </label>
            {lowStock && (
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 1)}
                className="w-24 border border-white/10 rounded-lg px-2 py-1 bg-black/20 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-zinc-500">Loading products...</div>
      ) : items.length === 0 ? (
        <div className="text-center p-10 rounded-2xl bg-black/20 border border-white/10 text-zinc-500">No products found.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(p => (
            <div key={p.id} className="group grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="col-span-1">
                <input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))} className="form-checkbox h-4 w-4 bg-transparent border-zinc-600 text-blue-500 focus:ring-blue-500" />
              </div>
              <div className="col-span-1">
                {p.images && p.images.length > 0 ? (
                  <img src={`${API_URL}${p.images[0].storageKey}`} alt={p.title} className="h-14 w-14 object-cover rounded-lg" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-black/20" />
                )}
              </div>
              <div className="col-span-4">
                <a href={`/products/${p.slug}`} className="font-semibold text-white hover:text-blue-400 transition-colors">{p.title}</a>
                <div className="text-xs text-zinc-500">/{p.slug}</div>
              </div>
              <div className="col-span-2">
                <StatusBadge status={p.status} />
              </div>
              <div className="col-span-2 text-zinc-300">
                <span className={p.stock < lowStockThreshold ? 'text-amber-400 font-bold' : ''}>{p.stock}</span> in stock
              </div>
              <div className="col-span-1 font-semibold text-white">
                ${(p.priceCents / 100).toFixed(2)}
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 rounded-full px-1 py-1">
                <a href={`/dashboard/products/${p.id}/edit`} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Edit size={16} /></a>
                <a href={`/products/${p.slug}`} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Eye size={16} /></a>
                <button onClick={() => onArchiveSingle(p)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Archive size={16} /></button>
                <button onClick={() => onDelete(p.id)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {anySelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 shadow-lg rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-zinc-300 mr-2">{selectedIds.length} selected</span>
          <button className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors" disabled={!!bulkLoading} onClick={() => bulkSetStatus('PUBLISHED')}>
            {bulkLoading === 'publish' ? 'Publishing…' : 'Publish'}
          </button>
          <button className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors" disabled={!!bulkLoading} onClick={() => bulkSetStatus('DRAFT')}>
            {bulkLoading === 'draft' ? 'Drafting…' : 'Set as Draft'}
          </button>
          <button className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors" disabled={!!bulkLoading} onClick={bulkDelete}>
            {bulkLoading === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
          <button className="text-xs text-zinc-400 hover:text-white" onClick={() => setSelected({})}>Clear</button>
        </div>
      )}
    </main>
  );
}
