"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCsrfToken } from "@/lib/csrf";
import { uploadImage } from "@/lib/uploadImage";
import StaticImage from "@/components/StaticImage";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
  images?: { id: string; storageKey: string; position: number }[];
  categories?: { category: { id: string; name: string } }[];
};

type Variant = {
  id: string;
  attributes: Record<string, string | number>;
  priceCents: number;
  stock: number;
  sku?: string;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { push } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number>(0);
  const [currency, setCurrency] = useState("EUR");
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<Product["status"]>("DRAFT");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ id: string; storageKey: string; position: number }[]>([]);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [savingCats, setSavingCats] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [creatingVar, setCreatingVar] = useState(false);
  const [varAttrsText, setVarAttrsText] = useState<string>("{}");
  const [varPriceCents, setVarPriceCents] = useState<number>(0);
  const [varStock, setVarStock] = useState<number>(0);
  const [varSku, setVarSku] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/products/id/${params.id}`, { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as Product;
          setProduct(data);
          setTitle(data.title);
          setDescription(data.description);
          setPriceCents(data.priceCents);
          setCurrency(data.currency);
          setStock(data.stock);
          setStatus(data.status);
          setImages((data.images || []).sort((a, b) => a.position - b.position));
          setCategoryIds((data.categories || []).map((pc) => pc.category.id));
        } else {
          setError(`Failed to load product (${res.status})`);
        }
      } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to load product");
      }
              } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' });
        if (res.ok) {
          const cats = (await res.json()) as Array<{ id: string; name: string }>;
          setAllCategories(cats);
        }
      } catch {}
    })();
  }, []);

  const onSaveCategories = async () => {
    setSavingCats(true);
    try {
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/categories`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ categoryIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
    } catch {}
    finally {
      setSavingCats(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        credentials: "include",
        body: JSON.stringify({ title, description, priceCents, currency, stock, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      push({ type: "success", title: "Saved", message: "Product updated" });
      router.push("/dashboard/products");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        push({ type: "error", title: "Save failed", message: err.message });
      } else {
        setError("Failed to save");
        push({ type: "error", title: "Save failed", message: "Unknown error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      // Use the dedicated uploadImage function with proper CSRF handling
      const uploadResult = await uploadImage(file);
      const fullUrl = `${API_URL}${uploadResult.path}`;
      // Immediately attach to product
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const add = await fetch(`${API_URL}/api/v1/products/${params.id}/images`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ imagePath: fullUrl }),
      });
      const addBody = await add.json().catch(() => ({}));
      if (!add.ok) throw new Error(addBody?.error || `Attach failed (${add.status})`);
      setImages((prev) => [...prev, { id: addBody.id, storageKey: addBody.storageKey, position: addBody.position }].sort((a, b) => a.position - b.position));
      push({ type: "success", title: "Uploaded", message: "Image uploaded" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Upload failed", message: err.message });
      } else {
        push({ type: "error", title: "Upload failed", message: "Unknown error" });
      }
    } finally {
      setUploading(false);
    }
  };

  const onDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      // Get CSRF token for protection
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/images/${imageId}`, { 
        method: "DELETE", 
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrfToken
        }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Delete failed", message: err.message });
      } else {
        push({ type: "error", title: "Delete failed", message: "Unknown error" });
      }
    }
  };

  const reorder = async (newOrder: { id: string }[]) => {
    try {
      // Get CSRF token for protection
      const csrfToken = await getCsrfToken();
      
      const order = newOrder.map((i) => i.id);
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/images/reorder`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        credentials: "include",
        body: JSON.stringify({ order }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setImages(newOrder.map((i, idx) => ({ ...images.find((im) => im.id === i.id)!, position: idx })));
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Reorder failed", message: err.message });
      } else {
        push({ type: "error", title: "Reorder failed", message: "Unknown error" });
      }
    }
  };

  const onMove = (imageId: string, dir: -1 | 1) => {
    const idx = images.findIndex((i) => i.id === imageId);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(idx, 1);
    copy.splice(swapIdx, 0, moved);
    reorder(copy);
  };

  const onSetCover = async (imageId: string) => {
    try {
      // Get CSRF token for protection
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/images/cover`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        credentials: "include",
        body: JSON.stringify({ imageId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      const sorted = images.slice().sort((a, b) => (a.id === imageId ? -1 : b.id === imageId ? 1 : a.position - b.position));
      setImages(sorted.map((im, idx) => ({ ...im, position: idx })));
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Set cover failed", message: err.message });
      } else {
        push({ type: "error", title: "Set cover failed", message: "Unknown error" });
      }
    }
  };

  // Variants helpers
  const loadVariants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/variants`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setVariants(data.items || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const onCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingVar(true);
    try {
      let attrs: Record<string, string | number> = {};
      try {
        attrs = varAttrsText ? JSON.parse(varAttrsText) : {};
      } catch (err) {
        alert('Attributes must be valid JSON');
        setCreatingVar(false);
        return;
      }
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/variants`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ attributes: attrs, priceCents: varPriceCents, stock: varStock, sku: varSku || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setVariants((prev) => [...prev, body]);
      setVarAttrsText('{}'); setVarPriceCents(0); setVarStock(0); setVarSku('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to create variant');
      }
    } finally {
      setCreatingVar(false);
    }
  };

  const onUpdateVariant = async (v: Variant, patch: Partial<Pick<Variant, 'priceCents'|'stock'|'sku'>>) => {
    try {
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/variants/${v.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setVariants((prev) => prev.map((it) => it.id === v.id ? { ...it, ...patch } : it));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to update variant');
      }
    }
  };

  const onDeleteVariant = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    try {
      // Dohvati CSRF token za zaštitu
      const csrfToken = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/products/${params.id}/variants/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setVariants((prev) => prev.filter((v) => v.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to delete variant');
      }
    }
  };

  if (loading) return <main className="p-6">Loading...</main>;
  if (error || !product) return <main className="p-6">{error || "Not found"}</main>;

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Edit product</h1>
      <form onSubmit={onSave} className="grid grid-cols-1 gap-4 max-w-xl card-base card-glass">
        <div>
          <label className="block text-sm mb-1">Categories</label>
          {!Array.isArray(allCategories) || allCategories.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">No categories yet.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {categoryIds.length === 0 && (
                  <span className="text-xs text-light-muted dark:text-dark-muted">No categories selected</span>
                )}
                {categoryIds.map((id) => {
                  const cat = Array.isArray(allCategories) ? allCategories.find((c) => c.id === id) : null;
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
                {Array.isArray(allCategories) && allCategories
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
              <div>
                <button type="button" className="btn-secondary" onClick={onSaveCategories} disabled={savingCats}>
                  {savingCats ? 'Saving…' : 'Save categories'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm mb-2">Images</label>
          <div className="flex items-center gap-3 mb-2">
            <input id="image" type="file" accept="image/*" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
            {uploading && <div className="text-sm text-light-muted dark:text-dark-muted">Uploading...</div>}
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((im, idx) => (
                <div key={im.id} className="relative group">
                  <StaticImage fileName={im.storageKey} alt="img" className="h-20 w-full rounded object-cover" />
                  <div className="mt-1 flex items-center gap-2">
                    <button type="button" className="text-xs underline" onClick={() => onMove(im.id, -1)} disabled={idx===0}>Up</button>
                    <button type="button" className="text-xs underline" onClick={() => onMove(im.id, 1)} disabled={idx===images.length-1}>Down</button>
                    <button type="button" className="text-xs underline" onClick={() => onSetCover(im.id)}>Cover</button>
                    <button type="button" className="text-xs underline text-rose-600" onClick={() => onDeleteImage(im.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="title">Title</label>
          <input id="title" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="description">Description</label>
          <textarea id="description" rows={4} className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1" htmlFor="price">Price (cents)</label>
            <input id="price" type="number" min={0} className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="currency">Currency</label>
            <input id="currency" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="stock">Stock</label>
            <input id="stock" type="number" min={0} className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="status">Status</label>
          <select id="status" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={status} onChange={(e) => setStatus(e.target.value as Product["status"]) }>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
        <div>
          <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
        <div>
          <label className="block text-sm mb-1">Variants</label>
          <div className="card-base p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs mb-1">Attributes (JSON)</label>
                <textarea rows={3} className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 dark:bg-zinc-800/30 text-xs" value={varAttrsText} onChange={(e) => setVarAttrsText(e.target.value)} placeholder='{"size":"M","color":"Black"}' />
              </div>
              <div>
                <label className="block text-xs mb-1">Price (cents)</label>
                <input type="number" min={0} className="w-full border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" value={varPriceCents} onChange={(e) => setVarPriceCents(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs mb-1">Stock</label>
                <input type="number" min={0} className="w-full border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" value={varStock} onChange={(e) => setVarStock(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs mb-1">SKU</label>
                <input className="w-full border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" value={varSku} onChange={(e) => setVarSku(e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={creatingVar}
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateVariant(e as unknown as React.FormEvent);
                  }}
                >
                  {creatingVar ? 'Adding…' : 'Add variant'}
                </button>
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No variants yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Attributes</th>
                      <th className="py-1">Price</th>
                      <th className="py-1">Stock</th>
                      <th className="py-1">SKU</th>
                      <th className="py-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-t border-light-glass-border">
                        <td className="py-1 pr-2 max-w-[280px]"><code className="text-xs break-words">{JSON.stringify(v.attributes)}</code></td>
                        <td className="py-1 pr-2">
                          <input type="number" min={0} className="w-24 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" defaultValue={v.priceCents} onBlur={(e) => onUpdateVariant(v, { priceCents: Number(e.target.value) })} />
                        </td>
                        <td className="py-1 pr-2">
                          <input type="number" min={0} className="w-20 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" defaultValue={v.stock} onBlur={(e) => onUpdateVariant(v, { stock: Number(e.target.value) })} />
                        </td>
                        <td className="py-1 pr-2">
                          <input className="w-28 border border-light-glass-border rounded-md px-2 py-1 bg-white/30 dark:bg-zinc-800/30 text-sm" defaultValue={v.sku || ''} onBlur={(e) => onUpdateVariant(v, { sku: e.target.value })} />
                        </td>
                        <td className="py-1 pr-2">
                          <button type="button" className="text-sm underline underline-offset-4 text-rose-600" onClick={() => onDeleteVariant(v.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
