"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { PlusCircle } from "lucide-react";

type Category = { id: string; name: string };

export default function AdminCategoriesPage() {
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
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
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
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-orange-300 to-transparent rounded-full" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">Categories</h1>
          <p className="text-zinc-300 text-sm">Create and manage product categories</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create card */}
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-white">New category</div>
            </div>
            <form onSubmit={onCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handmade Ceramics"
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>
              {error && <div className="text-sm text-red-400">{error}</div>}
              {success && <div className="text-sm text-emerald-400">{success}</div>}
              <button
                type="submit"
                disabled={creating}
                className="group relative inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-sm border border-white/10 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 hover:from-red-500/40 hover:to-orange-500/40 transition-colors disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                {creating ? "Creating…" : "Create category"}
              </button>
            </form>
          </div>

          {/* List card */}
          <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <div className="text-lg font-semibold mb-3 text-white">Existing categories</div>
            {loading ? (
              <div className="text-sm text-zinc-300">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-zinc-300">No categories yet.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between">
                    <div className="text-zinc-100 font-medium">{c.name}</div>
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
