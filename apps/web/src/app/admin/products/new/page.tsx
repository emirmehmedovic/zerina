"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

 type Shop = { id: string; name: string; slug: string };
 type CreatedProduct = { id: string; title: string; slug: string };

export default function AdminNewProductPage() {
  const { push } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopId, setShopId] = useState<string>("");

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number>(1999);
  const [currency, setCurrency] = useState("EUR");
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED">("DRAFT");
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShops = async () => {
      setLoadingShops(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/shops?take=500`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const list = (data.items || []) as Array<{ id: string; name: string; slug: string; status: string }>;
          setShops(list.map((s) => ({ id: s.id, name: s.name, slug: s.slug })));
          if (list.length > 0) setShopId(list[0].id);
        } else {
          setError(`Failed to load shops (${res.status})`);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load shops");
      } finally {
        setLoadingShops(false);
      }
    };
    loadShops();
  }, []);

  const onUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${API_URL}/api/v1/uploads`, { method: "POST", credentials: "include", body: form });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Upload failed (${res.status})`);
        uploaded.push(`${API_URL}${body.path}`);
      }
      setImagePaths((prev) => [...prev, ...uploaded]);
      push({ type: "success", title: "Uploaded", message: `${uploaded.length} image(s) uploaded` });
    } catch (err: any) {
      push({ type: "error", title: "Upload failed", message: err?.message || "Unknown error" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      push({ type: "error", title: "Missing shop", message: "Please select a shop." });
      return;
    }
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/shop/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, priceCents, currency, stock, status, imagePaths }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setCreated(body as CreatedProduct);
      push({ type: "success", title: "Created", message: "Product created" });
    } catch (err: any) {
      setError(err?.message || "Failed to create product");
      push({ type: "error", title: "Create failed", message: err?.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Admin · New product</h1>
      {created ? (
        <div className="card-base card-glass p-4">
          <p className="mb-2">Product <span className="font-medium">{created.title}</span> created.</p>
          <div className="flex gap-3">
            <a className="btn-primary" href={`/products/${created.slug ?? created.id}`}>View product</a>
            {shops.length > 0 && (
              <a className="text-sm underline underline-offset-4" href={`/shops/${shops.find((s) => s.id === shopId)?.slug}`}>View shop</a>
            )}
          </div>
        </div>
      ) : (
        <div className="card-base card-glass">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" htmlFor="shop">Shop</label>
                <select
                  id="shop"
                  disabled={loadingShops}
                  className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="title">Title</label>
              <input
                id="title"
                required
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product title"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={4}
                required
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the product"
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
              <label className="block text-sm mb-1" htmlFor="images">Images</label>
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))}
                className="block"
              />
              {imagePaths.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {imagePaths.map((p) => (
                    <img key={p} src={p} alt="uploaded" className="h-20 w-full rounded object-cover" />
                  ))}
                </div>
              )}
              {uploading && <div className="text-sm text-light-muted dark:text-dark-muted mt-1">Uploading...</div>}
            </div>

            {error && <div className="text-rose-600 text-sm">{error}</div>}

            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
