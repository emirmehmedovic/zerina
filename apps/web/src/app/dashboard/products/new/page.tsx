"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { uploadImage } from "@/lib/uploadImage";
import StaticImage from "@/components/StaticImage";

type Shop = {
  id: string;
  name: string;
  slug: string;
};

type CreatedProduct = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
};

export default function NewProductPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number>(1999);
  const [currency, setCurrency] = useState("EUR");
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED">("DRAFT");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedProduct | null>(null);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/shops/mine`, { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as Shop;
          if (!cancelled) setShop(data);
        }
        const resCats = await fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' });
        if (resCats.ok) {
          const raw = await resCats.json();
          const cats: Array<{ id: string; name: string }> = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.items)
            ? raw.items
            : [];
          if (!cancelled) setAllCategories(cats);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load your shop");
      } finally {
        if (!cancelled) setLoadingShop(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      // Get CSRF token for protection
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ title, description, priceCents, currency, stock, status, imagePaths, categoryIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as CreatedProduct;
      setCreated(data);
    } catch (err: any) {
      setError(err?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">New Product</h1>
      {loadingShop ? (
        <p className="text-light-muted dark:text-dark-muted">Loading your shop...</p>
      ) : error ? (
        <div className="card-base card-glass">
          <p className="text-red-600 text-sm">{error}</p>
          <div className="mt-3">
            <a className="text-sm underline underline-offset-4" href="/dashboard/shop">Go to dashboard</a>
          </div>
        </div>
      ) : created ? (
        <div className="card-base card-glass">
          <p className="mb-2">Product <span className="font-medium">{created.title}</span> created.</p>
          <div className="flex gap-3">
            <a className="btn-primary" href={`/products/${created.slug || created.id}`}>View product</a>
            {shop && <a className="text-sm underline underline-offset-4" href={`/shops/${shop.slug}`}>View your shop</a>}
          </div>
        </div>
      ) : (
        <div className="card-base card-glass">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 max-w-xl">
            <div>
              <label className="block text-sm mb-1">Categories</label>
              {allCategories.length === 0 ? (
                <div className="text-sm text-light-muted dark:text-dark-muted">No categories yet.</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {categoryIds.length === 0 && (
                      <span className="text-xs text-light-muted dark:text-dark-muted">No categories selected</span>
                    )}
                    {categoryIds.map((id) => {
                      const cat = allCategories.find((c) => c.id === id);
                      if (!cat) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-zinc-800/40 border border-light-glass-border">
                          {cat.name}
                          <button type="button" aria-label="Remove" onClick={() => setCategoryIds((prev) => prev.filter((x) => x !== id))}>×</button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allCategories
                      .filter((c) => !categoryIds.includes(c.id))
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="text-xs px-2 py-1 rounded-full border border-light-glass-border hover:bg-white/40 dark:hover:bg-zinc-800/40"
                          onClick={() => setCategoryIds((prev) => [...prev, c.id])}
                        >
                          + {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="images">Images</label>
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length === 0) return;
                  setUploading(true);
                  try {
                    const uploaded: string[] = [];
                    for (const file of files) {
                      // Use the dedicated uploadImage function with proper CSRF handling
                      const uploadResult = await uploadImage(file);
                      // Save as '/uploads/filename.ext' to keep it consistent
                      uploaded.push(uploadResult.path);
                    }
                    setImagePaths((prev) => [...prev, ...uploaded]);
                  } catch (err) {
                    alert((err as any)?.message || 'Upload failed');
                  } finally {
                    setUploading(false);
                  }
                }}
                className="block"
              />
              {imagePaths.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {imagePaths.map((p) => (
                    <StaticImage key={p} fileName={p} alt="uploaded" className="h-20 w-full rounded object-cover" />
                  ))}
                </div>
              )}
              {uploading && <div className="text-sm text-light-muted dark:text-dark-muted mt-1">Uploading...</div>}
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="title">Title</label>
              <input
                id="title"
                required
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Handmade Mug"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about this product..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1" htmlFor="price">Price (cents)</label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="currency">Currency</label>
                <input
                  id="currency"
                  className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="stock">Stock</label>
                <input
                  id="stock"
                  type="number"
                  min={0}
                  className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="status">Status</label>
              <select
                id="status"
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div>
              <button className="btn-primary" disabled={submitting || !shop}>
                {submitting ? "Creating..." : "Create product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
