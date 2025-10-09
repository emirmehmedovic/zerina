"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Category = { id: string; name: string };

export default function DashboardCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, { cache: "no-store", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      const cats = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setItems(cats);
    } catch (e) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = name.trim();
    if (!val) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      setName("");
      setSuccess("Category created");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create category");
    } finally {
      setCreating(false);
      setTimeout(() => setSuccess(null), 2500);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-900">Categories</h1>
          <p className="text-amber-900/80 mt-1">Create and manage product categories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <div className="card-base card-glass p-5 ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
            <div className="text-lg font-semibold mb-3 text-amber-900">New category</div>
            <form onSubmit={onCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handmade Ceramics"
                  className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 placeholder-amber-700/50 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40"
                />
              </div>
              {error && <div className="text-sm text-red-700">{error}</div>}
              {success && <div className="text-sm text-emerald-700">{success}</div>}
              <button
                type="submit"
                disabled={creating}
                className="group relative rounded-xl px-5 py-3 font-semibold text-amber-900 shadow-sm ring-1 ring-rose-200/60 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create category"}
                <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(244,114,182,0.25)_inset]" />
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 card-base card-glass p-5 ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
            <div className="text-lg font-semibold mb-3 text-amber-900">Existing categories</div>
            {loading ? (
              <div className="text-sm text-amber-900/80">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-amber-900/80">No categories yet.</div>
            ) : (
              <ul className="divide-y divide-rose-200/50">
                {items.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between">
                    <div className="text-amber-900 font-medium">{c.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
