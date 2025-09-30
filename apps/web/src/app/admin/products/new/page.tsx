"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import ImageUploader from '@/components/ImageUploader';
import StaticImage from '@/components/StaticImage';
import { Save, Send, X } from 'lucide-react';

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
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [imagePaths, setImagePaths] = useState<string[]>([]);
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

  const onUpload = (path: string) => {
    setImagePaths((prev) => [...prev, path]);
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
          <h1 className="text-2xl font-bold text-white">Admin Product Launchpad</h1>
          <p className="text-zinc-400">Create a new product for any shop.</p>
        </div>
      </div>

      {created ? (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-10 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Product Created!</h2>
          <p className="text-zinc-400 mb-6">New product <span className="font-medium text-emerald-400">{created.title}</span> is now available.</p>
          <div className="flex items-center justify-center gap-4">
            <a className="px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors" href={`/products/${created.slug || created.id}`}>View Product</a>
            <a className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 transition-colors" href="/admin/inventory">Back to Inventory</a>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Core Details</h3>
              <div className="space-y-4">
                <FormInput label="Title" id="title" required value={title} onChange={(e:any) => setTitle(e.target.value)} placeholder="e.g., Artisan Ceramic Mug" />
                <FormTextarea label="Description" id="description" required rows={6} value={description} onChange={(e:any) => setDescription(e.target.value)} placeholder="Describe the product..." />
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
              <ImageUploader onUpload={onUpload} />
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
            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Organization</h3>
              <div className="space-y-4">
                <FormSelect label="Shop" id="shop" value={shopId} onChange={(e:any) => setShopId(e.target.value)} disabled={loadingShops}>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </FormSelect>
                <FormSelect label="Status" id="status" value={status} onChange={(e:any) => setStatus(e.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </FormSelect>
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h3>
              <div className="space-y-4">
                <FormInput label="Price (in cents)" id="price" type="number" min={0} value={priceCents} onChange={(e:any) => setPriceCents(Number(e.target.value))} />
                <FormInput label="Currency" id="currency" value={currency} onChange={(e:any) => setCurrency(e.target.value.toUpperCase())} />
                <FormInput label="Stock" id="stock" type="number" min={0} value={stock} onChange={(e:any) => setStock(Number(e.target.value))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" onClick={() => setStatus('DRAFT')} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 font-semibold flex items-center justify-center gap-2 transition-colors" disabled={submitting}>
                <Save size={16} /> Save as Draft
              </button>
              <button type="submit" onClick={() => setStatus('PUBLISHED')} className="flex-1 px-4 py-2.5 rounded-lg border border-transparent bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors" disabled={submitting}>
                <Send size={16} /> Publish
              </button>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
