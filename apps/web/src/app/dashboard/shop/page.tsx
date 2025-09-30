"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

export default function DashboardShopPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/shops/mine`, { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as Shop;
          if (!cancelled) setShop(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as Shop;
      setShop(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create shop");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Vendor Dashboard</h1>
      {loading ? (
        <p className="text-light-muted dark:text-dark-muted">Loading...</p>
      ) : shop ? (
        <div className="card-base card-glass">
          <h2 className="text-2xl font-semibold mb-2">Your shop</h2>
          <p className="mb-2"><span className="font-medium">Name:</span> {shop.name}</p>
          {shop.description && (
            <p className="mb-2"><span className="font-medium">Description:</span> {shop.description}</p>
          )}
          <p className="mb-4"><span className="font-medium">Slug:</span> {shop.slug}</p>
          <div className="flex gap-3">
            <a className="btn-primary" href={`/shops/${shop.slug}`}>View shop</a>
            <a className="text-sm underline underline-offset-4" href="/dashboard/products/new">Create product</a>
          </div>
        </div>
      ) : (
        <div className="card-base card-glass">
          <h2 className="text-2xl font-semibold mb-4">Create your shop</h2>
          {error && <p className="mb-3 text-red-600 text-sm">{error}</p>}
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="name">Name</label>
              <input
                id="name"
                required
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Shop"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="description">Description</label>
              <textarea
                id="description"
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell buyers about your shop"
              />
            </div>
            <button className="btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create shop"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
