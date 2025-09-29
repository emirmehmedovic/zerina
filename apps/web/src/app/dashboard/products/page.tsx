"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { useToast } from "@/components/ToastProvider";

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

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">My products</h1>
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
          />
          <select
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={status}
            disabled={archivedOnly}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={archivedOnly} onChange={(e)=>{ setArchivedOnly(e.target.checked); if(e.target.checked) setStatus(''); }} /> Archived only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} /> Low stock
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
          <a className="btn-primary" href="/dashboard/products/new">New product</a>
        </div>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <button className="btn-secondary" disabled={!anySelected || !!bulkLoading} onClick={() => bulkSetStatus('PUBLISHED')}>
          {bulkLoading === 'publish' ? 'Publishing…' : 'Publish selected'}
        </button>
        <button className="btn-secondary" disabled={!anySelected || !!bulkLoading} onClick={() => bulkSetStatus('DRAFT')}>
          {bulkLoading === 'draft' ? 'Marking draft…' : 'Mark Draft'}
        </button>
        <button className="btn-secondary" disabled={!anySelected || !!bulkLoading} onClick={() => bulkSetStatus('ARCHIVED')}>
          {bulkLoading === 'delete' ? 'Archiving…' : 'Archive selected'}
        </button>
        <button className="btn-danger" disabled={!anySelected || !!bulkLoading} onClick={bulkDelete}>
          {bulkLoading === 'delete' ? 'Deleting…' : 'Delete selected'}
        </button>
        <div className="flex-1" />
        <button className="btn-secondary" onClick={exportCSV}>Export CSV</button>
      </div>
      {loading ? (
        <div className="card-base card-glass">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card-base card-glass">No products yet.</div>
      ) : (
        <>
        <div className="overflow-x-auto card-base card-glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2">
                  <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th className="py-2">Image</th>
                <th className="py-2 cursor-pointer" onClick={() => setSortKey("title")}>Title {sort.key === "title" ? (sort.dir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="py-2 cursor-pointer" onClick={() => setSortKey("price")}>Price {sort.key === "price" ? (sort.dir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="py-2 cursor-pointer" onClick={() => setSortKey("stock")}>Stock {sort.key === "stock" ? (sort.dir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="py-2 cursor-pointer" onClick={() => setSortKey("status")}>Status {sort.key === "status" ? (sort.dir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-t border-light-glass-border">
                  <td className="py-2 pr-2">
                    <input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))} />
                  </td>
                  <td className="py-2 pr-2">
                    {p.images && p.images.length > 0 ? (
                      <img src={`${API_URL}${p.images[0].storageKey}`} alt={p.title} className="h-12 w-12 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-black/10 dark:bg-white/10" />
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-light-muted dark:text-dark-muted">/{p.slug}</div>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      defaultValue={formatNumber(p.priceCents/100)}
                      onBlur={(e) => {
                        const cents = parsePriceToCents(e.currentTarget.value, p.priceCents);
                        // Reformat input visually to locale with two decimals
                        e.currentTarget.value = formatNumber(cents / 100);
                        if (cents !== p.priceCents) onUpdateField(p, { priceCents: cents });
                      }}
                      className="w-28 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm"
                      title="Price"
                      inputMode="decimal"
                    />
                    <span className="ml-1 text-xs text-light-muted dark:text-dark-muted">{p.currency}</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      onBlur={(e) => onUpdateField(p, { stock: Number(e.target.value) || 0 })}
                      className="w-20 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm"
                      title="Stock"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => onToggleStatus(p)}
                      className={`text-xs px-2 py-1 rounded border ${p.status === "PUBLISHED" ? "border-emerald-400/50" : "border-amber-400/50"}`}
                      title="Toggle Draft/Published"
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-3">
                      <a className="underline underline-offset-4" href={`/dashboard/products/${p.id}/edit`}>Edit</a>
                      {p.status === 'ARCHIVED' ? (
                        <button className="underline underline-offset-4" onClick={() => onUpdateField(p, { status: 'DRAFT' as any })}>Unarchive</button>
                      ) : (
                        <button className="underline underline-offset-4" onClick={() => onArchiveSingle(p)}>Archive</button>
                      )}
                      <button className="underline underline-offset-4" onClick={() => onDelete(p.id)}>Delete</button>
                      <a className="underline underline-offset-4" href={`/products/${p.slug}`}>View</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        </>
      )}

      {/* Sticky bulk toolbar (shows only when any rows are selected) */}
      {anySelected && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 shadow-lg rounded-full border border-light-glass-border bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 py-2 flex items-center gap-2">
          <div className="text-xs mr-2">{selectedIds.length} selected</div>
          <button className="btn-secondary text-xs" disabled={!!bulkLoading} onClick={() => bulkSetStatus('PUBLISHED')}>
            {bulkLoading === 'publish' ? 'Publishing…' : 'Publish'}
          </button>
          <button className="btn-secondary text-xs" disabled={!!bulkLoading} onClick={() => bulkSetStatus('DRAFT')}>
            {bulkLoading === 'draft' ? 'Drafting…' : 'Mark draft'}
          </button>
          <button className="btn-secondary text-xs" disabled={!!bulkLoading} onClick={() => bulkSetStatus('ARCHIVED')}>
            {bulkLoading === 'delete' ? 'Archiving…' : 'Archive'}
          </button>
          <button className="btn-danger text-xs" disabled={!!bulkLoading} onClick={bulkDelete}>
            {bulkLoading === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
          <button className="text-xs underline underline-offset-4" onClick={() => setSelected({})}>Clear</button>
        </div>
      )}
    </main>
  );
}
