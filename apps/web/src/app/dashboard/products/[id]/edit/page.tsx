"use client";

import { useEffect, useRef, useState } from "react";
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
  const [currency, setCurrency] = useState("AED");
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
          // Force AED display per requirement
          setCurrency("AED");
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

  // Debounced UI mirrors
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("0.00");
  const [stockInput, setStockInput] = useState("0");
  useEffect(() => setTitleInput(title), [title]);
  useEffect(() => setDescriptionInput(description), [description]);
  useEffect(() => setPriceDisplay((priceCents/100).toFixed(2)), [priceCents]);
  useEffect(() => setStockInput(String(stock)), [stock]);
  useEffect(() => { const t = setTimeout(()=> setTitle(titleInput), 300); return () => clearTimeout(t); }, [titleInput]);
  useEffect(() => { const t = setTimeout(()=> setDescription(descriptionInput), 300); return () => clearTimeout(t); }, [descriptionInput]);
  useEffect(() => { const t = setTimeout(()=> { const v=parseFloat(priceDisplay||'0'); setPriceCents(Math.round((isNaN(v)?0:v)*100)); }, 300); return () => clearTimeout(t); }, [priceDisplay]);
  useEffect(() => { const t = setTimeout(()=> setStock(Math.max(0, Number(stockInput)||0)), 300); return () => clearTimeout(t); }, [stockInput]);

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
        body: JSON.stringify({ title, description, priceCents, currency: "AED", stock, status }),
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

  const onUpdateVariant = async (v: Variant, patch: Partial<Pick<Variant, 'priceCents'|'stock'|'sku'>> & { attributes?: Record<string, string | number> }) => {
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
    <main className="relative">
      {/* Warm admin-style decorative background */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <h1 className="text-2xl font-bold mb-4 text-white">Edit product</h1>
      <form onSubmit={onSave} className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm mb-1 text-white/90">Categories</label>
          {!Array.isArray(allCategories) || allCategories.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">No categories yet.</div>
          ) : (
            <div className="space-y-2 rounded-md border border-white/10 p-3 bg-black/20 backdrop-blur-md">
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
        <div className="rounded-md border border-white/10 p-3 bg-black/20 backdrop-blur-md">
          <label className="block text-sm mb-2 text-white/90">Images</label>
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
        <div className="rounded-md border border-white/10 p-3 bg-black/20 backdrop-blur-md">
          <label className="block text-sm mb-1 text-white/90" htmlFor="title">Title</label>
          <input id="title" className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} required />
        </div>
        <div className="rounded-md border border-white/10 p-3 bg-black/20 backdrop-blur-md">
          <label className="block text-sm mb-1 text-white/90" htmlFor="description">Description</label>
          <textarea id="description" rows={4} className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30" value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1 text-white/90" htmlFor="price">Price</label>
            <input id="price" type="number" step="0.01" min={0} className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90">Currency</label>
            <div className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30 text-zinc-200">AED</div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90" htmlFor="stock">Stock</label>
            <input id="stock" type="number" min={0} className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30" value={stockInput} onChange={(e) => setStockInput(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/90" htmlFor="status">Status</label>
          <select id="status" className="w-full border border-white/10 rounded-md px-3 py-2 bg-black/30" value={status} onChange={(e) => setStatus(e.target.value as Product["status"]) }>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
        <div>
          <button className="px-4 py-2 rounded text-white font-semibold bg-gradient-to-r from-red-500/40 via-orange-500/40 to-red-500/40 hover:from-red-500/50 hover:to-orange-500/50 border border-white/10" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
        <div className="rounded-md border border-white/10 p-3 bg-black/20 backdrop-blur-md">
          <label className="block text-sm mb-1 text-white/90">Variants</label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-md border border-white/10 p-3">
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 text-white/80">Add attribute</label>
                <div className="text-xs text-light-muted dark:text-dark-muted">Use the per-variant editor below to manage attributes after creation.</div>
              </div>
              <div>
                <label className="block text-xs mb-1 text-white/80">Price</label>
                <input type="number" step="0.01" min={0} className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" value={(varPriceCents/100).toString()} onChange={(e) => setVarPriceCents(Math.round((parseFloat(e.target.value||'0')||0)*100))} />
              </div>
              <div>
                <label className="block text-xs mb-1 text-white/80">Stock</label>
                <input type="number" min={0} className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" value={varStock} onChange={(e) => setVarStock(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs mb-1 text-white/80">SKU</label>
                <input className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" value={varSku} onChange={(e) => setVarSku(e.target.value)} />
              </div>
              <div className="md:col-span-5">
                <button 
                  type="button"
                  className="px-3 py-2 rounded border border-white/10 text-white text-sm bg-gradient-to-r from-red-500/20 to-orange-500/20"
                  disabled={creatingVar}
                  onClick={(e) => { e.preventDefault(); onCreateVariant(e as unknown as React.FormEvent); }}
                >
                  {creatingVar ? 'Adding…' : 'Add variant'}
                </button>
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="text-sm text-light-muted dark:text-dark-muted">No variants yet.</div>
            ) : (
              <div className="space-y-3">
                {variants.map((v) => {
                  // local debounced editors
                  const priceTimer = { current: undefined as any };
                  const stockTimer = { current: undefined as any };
                  const skuTimer = { current: undefined as any };
                  const [k, setK] = [undefined, undefined] as any; // placeholder to avoid TS complaints in inline map
                  const attrs = v.attributes || {} as Record<string, any>;
                  const pairs = Object.keys(attrs).map((key) => `${key}=${attrs[key]}`);
                  return (
                    <div key={v.id} className="rounded border border-white/10 p-3">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                        <div className="md:col-span-2">
                          <div className="text-xs text-white/80 mb-1">Attributes</div>
                          <div className="flex flex-wrap gap-2">
                            {pairs.length === 0 ? (
                              <span className="text-xs text-light-muted dark:text-dark-muted">None</span>
                            ) : pairs.map((p) => (
                              <span key={p} className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-white/10">
                                {p}
                                <button type="button" onClick={async ()=>{
                                  const [rmKey] = p.split('=');
                                  const next: Record<string, any> = { ...attrs };
                                  delete next[rmKey];
                                  await onUpdateVariant(v, { attributes: next as any });
                                }} className="text-zinc-400 hover:text-white">×</button>
                              </span>
                            ))}
                          </div>
                          {/* Simple add key/value */}
                          <div className="mt-2 flex items-center gap-2">
                            <input placeholder="Key" className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs" id={`key-${v.id}`} />
                            <input placeholder="Value" className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs" id={`val-${v.id}`} />
                            <button type="button" className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10" onClick={async ()=>{
                              const keyEl = document.getElementById(`key-${v.id}`) as HTMLInputElement | null;
                              const valEl = document.getElementById(`val-${v.id}`) as HTMLInputElement | null;
                              const key = keyEl?.value.trim() || '';
                              const val = valEl?.value.trim() || '';
                              if (!key || !val) return;
                              const next = { ...(attrs||{}) } as Record<string, any>;
                              next[key] = val;
                              await onUpdateVariant(v, { attributes: next as any });
                              if (keyEl) keyEl.value = '';
                              if (valEl) valEl.value = '';
                            }}>Add</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-white/80 mb-1">Price</label>
                          <input type="number" step="0.01" min={0} className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" defaultValue={(v.priceCents/100).toString()} onBlur={(e) => onUpdateVariant(v, { priceCents: Math.round((parseFloat(e.target.value||'0')||0)*100) })} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/80 mb-1">Stock</label>
                          <input type="number" min={0} className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" defaultValue={v.stock} onBlur={(e) => onUpdateVariant(v, { stock: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="block text-xs text-white/80 mb-1">SKU</label>
                          <input className="w-full border border-white/10 rounded-md px-2 py-1 bg-black/30 text-sm" defaultValue={v.sku || ''} onBlur={(e) => onUpdateVariant(v, { sku: e.target.value })} />
                        </div>
                        <div>
                          <button type="button" className="text-sm underline underline-offset-4 text-rose-500" onClick={() => onDeleteVariant(v.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
