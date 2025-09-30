"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { uploadImage } from "@/lib/uploadImage";
import StaticImage from "@/components/StaticImage";
import ImageUploader from '@/components/ImageUploader';
import { Save, Send, X } from 'lucide-react';

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

  const FormInput = ({ label, id, ...props }: any) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  const FormTextarea = ({ label, id, ...props }: any) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <textarea id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  const FormSelect = ({ label, id, children, ...props }: any) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <select id={id} {...props} className="w-full border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
        {children}
      </select>
    </div>
  );

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Launchpad</h1>
          <p className="text-zinc-400">Create and configure a new product.</p>
        </div>
      </div>

      {loadingShop ? (
        <div className="text-center p-10 text-zinc-500">Loading...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
      ) : created ? (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Product Created!</h2>
          <p className="text-zinc-400 mb-6">Your new product, <span className="font-medium text-emerald-400">{created.title}</span>, is live.</p>
          <div className="flex items-center justify-center gap-4">
            <a className="px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors" href={`/products/${created.slug || created.id}`}>View Product</a>
            <a className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 transition-colors" href="/dashboard/products">Back to Products</a>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Core Details */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Core Details</h3>
              <div className="space-y-4">
                <FormInput label="Title" id="title" required value={title} onChange={(e:any) => setTitle(e.target.value)} placeholder="e.g., Artisan Ceramic Mug" />
                <FormTextarea label="Description" id="description" required rows={6} value={description} onChange={(e:any) => setDescription(e.target.value)} placeholder="Describe your product's features, materials, and story..." />
              </div>
            </div>

            {/* Images */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
              <ImageUploader onUpload={(path) => setImagePaths(prev => [...prev, path])} />
              {imagePaths.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imagePaths.map((p) => (
                    <div key={p} className="relative group">
                      <StaticImage fileName={p} alt="uploaded" className="h-24 w-full rounded-lg object-cover" />
                      <button type="button" onClick={() => setImagePaths(prev => prev.filter(ip => ip !== p))} className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Pricing & Inventory */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h3>
              <div className="space-y-4">
                <FormInput label="Price (in cents)" id="price" type="number" min={0} value={priceCents} onChange={(e:any) => setPriceCents(Number(e.target.value))} />
                <FormInput label="Currency" id="currency" value={currency} onChange={(e:any) => setCurrency(e.target.value.toUpperCase())} />
                <FormInput label="Stock" id="stock" type="number" min={0} value={stock} onChange={(e:any) => setStock(Number(e.target.value))} />
              </div>
            </div>

            {/* Organization */}
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Organization</h3>
              <div className="space-y-4">
                <FormSelect label="Status" id="status" value={status} onChange={(e:any) => setStatus(e.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </FormSelect>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Categories</label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 min-h-[24px]">
                      {categoryIds.map((id) => {
                        const cat = allCategories.find((c) => c.id === id);
                        if (!cat) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-white/10">
                            {cat.name}
                            <button type="button" aria-label="Remove" onClick={() => setCategoryIds((prev) => prev.filter((x) => x !== id))} className="text-zinc-400 hover:text-white"><X size={12} /></button>
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {allCategories.filter((c) => !categoryIds.includes(c.id)).map((c) => (
                        <button key={c.id} type="button" className="text-xs px-2 py-1 rounded-full border border-white/10 hover:bg-white/10" onClick={() => setCategoryIds((prev) => [...prev, c.id])}>
                          + {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button type="submit" onClick={() => setStatus('DRAFT')} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 font-semibold flex items-center justify-center gap-2 transition-colors" disabled={submitting || !shop}>
                <Save size={16} /> Save as Draft
              </button>
              <button type="submit" onClick={() => setStatus('PUBLISHED')} className="flex-1 px-4 py-2.5 rounded-lg border border-transparent bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors" disabled={submitting || !shop}>
                <Send size={16} /> Publish
              </button>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
