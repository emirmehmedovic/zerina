"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [currency, setCurrency] = useState("AED");
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED">("DRAFT");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedProduct | null>(null);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  // variants (MVP): a list of rows with sku, priceCents, stock, attributes (parsed from key=value pairs)
  const [variants, setVariants] = useState<Array<{ id: string; sku?: string; priceCents: number; stock: number; attrText: string }>>([]);
  // debounced input mirrors
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [priceDisplay, setPriceDisplay] = useState<string>("" + (priceCents/100).toFixed(2));
  const [stockInput, setStockInput] = useState<string>(String(0));
  useEffect(() => setTitleInput(title), [title]);
  useEffect(() => setDescriptionInput(description), [description]);
  useEffect(() => setPriceDisplay((priceCents/100).toFixed(2)), [priceCents]);
  useEffect(() => setStockInput(String(stock)), [stock]);
  // debouncers
  useEffect(() => {
    const t = setTimeout(() => setTitle(titleInput), 300);
    return () => clearTimeout(t);
  }, [titleInput]);
  useEffect(() => {
    const t = setTimeout(() => setDescription(descriptionInput), 300);
    return () => clearTimeout(t);
  }, [descriptionInput]);
  useEffect(() => {
    const t = setTimeout(() => {
      const val = parseFloat(priceDisplay || '0');
      setPriceCents(Math.round((isNaN(val)?0:val) * 100));
    }, 300);
    return () => clearTimeout(t);
  }, [priceDisplay]);
  useEffect(() => {
    const t = setTimeout(() => setStock(Math.max(0, Number(stockInput) || 0)), 300);
    return () => clearTimeout(t);
  }, [stockInput]);
  // options builder
  const [options, setOptions] = useState<Array<{ id: string; name: string; values: string[]; newValue: string }>>([]);
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [genNotice, setGenNotice] = useState<string>("");
  const variantsRef = useRef<HTMLDivElement | null>(null);
  const canGenerate = useMemo(() => options.length>0 && options.every(o => o.name.trim().length>0 && o.values.length>0), [options]);

  // Presets helper
  const addOptionPreset = (name: string, values: string[]) => {
    setOptions(prev => {
      const existing = prev.find(o => o.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        const merged = Array.from(new Set([...(existing.values||[]), ...values]));
        return prev.map(o => o.id===existing.id ? { ...o, name, values: merged } : o);
      }
      return [...prev, { id: crypto.randomUUID(), name, values: Array.from(new Set(values)), newValue: '' }];
    });
  };

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
      } catch (e: unknown) {
        if (!cancelled) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError("Failed to load your shop");
          }
        }
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
        body: JSON.stringify({
          title,
          description,
          priceCents,
          currency,
          stock,
          status,
          imagePaths,
          categoryIds,
          variants: variants.map(v => ({
            sku: v.sku,
            priceCents: v.priceCents,
            stock: v.stock,
            attributes: (v.attrText || '').split(',').map(s => s.trim()).filter(Boolean).reduce((acc: Record<string,string>, pair) => {
              const [k, ...rest] = pair.split('=');
              const val = (rest.join('=') || '').trim();
              if (k && val) acc[k.trim()] = val;
              return acc;
            }, {}),
          }))
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as CreatedProduct;
      setCreated(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create product");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const FormInput = ({ label, id, ...props }: { label: string; id: string; [key: string]: unknown }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  // Generate variants from options (cartesian product)
  const generateVariantsFromOptions = () => {
    if (!canGenerate) {
      setGenNotice("Add at least one option with a name and one or more values.");
      return;
    }
    // Cartesian product
    const carts = options.reduce<string[][]>((acc, opt) => {
      const vals = opt.values.map(v => `${opt.name.trim()}=${v.trim()}`);
      if (acc.length === 0) return vals.map(v => [v]);
      const next: string[][] = [];
      for (const prev of acc) {
        for (const v of vals) next.push([...prev, v]);
      }
      return next;
    }, []);
    const newRows = carts.map(parts => {
      const attrText = parts.join(', ');
      return { id: crypto.randomUUID(), sku: '', priceCents, stock, attrText };
    });
    setVariants(newRows);
    setGenNotice(`Generated ${newRows.length} variant${newRows.length===1?'':'s'}.`);
    // Scroll to variants section for visibility
    setTimeout(() => variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const FormTextarea = ({ label, id, ...props }: { label: string; id: string; [key: string]: unknown }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <textarea id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  const FormSelect = ({ label, id, children, ...props }: { label: string; id: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <select id={id} {...props} className="w-full border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
        {children}
      </select>
    </div>
  );

  const VariantRow = ({ idx, v, onChange, onRemove, optDefs }: { idx: number; v: { id: string; sku?: string; priceCents: number; stock: number; attrText: string }; onChange: (nv: any) => void; onRemove: () => void; optDefs: Array<{ name: string; values: string[] }> }) => {
    const priceTimer = useRef<number|undefined>(undefined);
    const stockTimer = useRef<number|undefined>(undefined);
    const skuTimer = useRef<number|undefined>(undefined);
    const [kvKey, setKvKey] = useState("");
    const [kvVal, setKvVal] = useState("");
    // derive current pairs and attribute object
    const pairs = (v.attrText || '').split(',').map(s=>s.trim()).filter(Boolean);
    const attrObj: Record<string,string> = pairs.reduce((acc, pair) => { const [k, ...rest] = pair.split('='); const val = rest.join('='); if (k && val) acc[k.trim()] = val.trim(); return acc; }, {} as Record<string,string>);
    const setAttrKV = (key: string, val: string) => {
      const next = { ...attrObj };
      if (!val) delete next[key]; else next[key] = val;
      const nextPairs = Object.entries(next).map(([k,v]) => `${k}=${v}`);
      onChange({ ...v, attrText: nextPairs.join(', ') });
    };
    const addKV = () => {
      const k = kvKey.trim(); const val = kvVal.trim();
      if (!k || !val) return;
      const current = (v.attrText || '').split(',').map(s=>s.trim()).filter(Boolean);
      current.push(`${k}=${val}`);
      onChange({ ...v, attrText: current.join(', ') });
      setKvKey(''); setKvVal('');
    };
    const removeKV = (pair: string) => {
      const current = (v.attrText || '').split(',').map(s=>s.trim()).filter(Boolean);
      onChange({ ...v, attrText: current.filter(p=>p!==pair).join(', ') });
    };
    return (
      <div className="space-y-2 rounded border border-white/10 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">SKU</label>
            <input defaultValue={v.sku || ''} onChange={(e)=>{ if (skuTimer.current) window.clearTimeout(skuTimer.current); skuTimer.current = window.setTimeout(()=> onChange({ ...v, sku: e.target.value }), 300); }} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm" placeholder="e.g. M-RED" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Price</label>
            <input type="number" step="0.01" min={0} defaultValue={(v.priceCents/100).toString()} onChange={(e)=>{
              if (priceTimer.current) window.clearTimeout(priceTimer.current);
              priceTimer.current = window.setTimeout(()=>{
                const val = parseFloat(e.target.value || '0');
                const cents = Math.round((isNaN(val)?0:val) * 100);
                onChange({ ...v, priceCents: cents });
              }, 300);
            }} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Stock</label>
            <input type="number" min={0} defaultValue={v.stock} onChange={(e)=>{
              if (stockTimer.current) window.clearTimeout(stockTimer.current);
              stockTimer.current = window.setTimeout(()=> onChange({ ...v, stock: Number(e.target.value) }), 300);
            }} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs text-zinc-400">Attributes</label>
            {/* Quick selectors for known options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {optDefs.filter(o => (o.values||[]).length>0).map((o) => (
                <div key={`${v.id}-${o.name}`}>
                  <label className="block text-[11px] text-zinc-400 mb-1">{o.name}</label>
                  <select value={attrObj[o.name] || ''} onChange={(e)=> setAttrKV(o.name, e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm">
                    <option value="">Select</option>
                    {o.values.map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {/* Fallback manual add */}
            <div className="flex items-center gap-2">
              <input value={kvKey} onChange={(e)=>setKvKey(e.target.value)} placeholder="Key (e.g., Custom)" className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm" />
              <input value={kvVal} onChange={(e)=>setKvVal(e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm" />
              <button type="button" onClick={addKV} className="text-xs px-2 py-2 rounded-md border border-white/10 hover:bg-white/10">Add</button>
            </div>
          </div>
        </div>
        {pairs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pairs.map((p) => (
              <span key={p} className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-white/10">
                {p}
                <button type="button" onClick={()=>removeKV(p)} className="text-zinc-400 hover:text-white">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="text-right">
          <button type="button" onClick={onRemove} className="text-xs px-2 py-1 rounded-md border border-white/10 hover:bg-white/10">Remove variant</button>
        </div>
      </div>
    );
  };

  return (
    <main className="relative">
      {/* Warm admin-style decorative background */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create product</h1>
        <p className="text-sm text-zinc-400">Simple, clear form to add a product and its variants.</p>
      </div>

      {loadingShop ? (
        <div className="text-center p-6 text-zinc-400">Loading…</div>
      ) : error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-300 p-3 text-sm">{error}</div>
      ) : created ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-white mb-1">Product created</h2>
          <p className="text-zinc-300 mb-4">{created.title}</p>
          <div className="flex items-center justify-center gap-3">
            <a className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold" href={`/products/${created.slug || created.id}`}>View</a>
            <a className="px-4 py-2 rounded-md border border-white/10 text-zinc-200 hover:bg-white/5 text-sm" href="/dashboard/products">Back to products</a>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
          {/* Core */}
          <section className="rounded-md border border-white/10 p-4 bg-black/20 backdrop-blur-md">
            <h3 className="text-base font-semibold text-white mb-3">Core</h3>
            <div className="space-y-3">
              <FormInput label="Title" id="title" required value={titleInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitleInput(e.target.value)} placeholder="e.g., Ceramic Mug" />
              <FormTextarea label="Description" id="description" required rows={5} value={descriptionInput} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescriptionInput(e.target.value)} placeholder="Describe the product…" />
            </div>
          </section>

          {/* Images */}
          <section className="rounded-md border border-white/10 p-4">
            <h3 className="text-base font-semibold text-white mb-3">Images</h3>
            <ImageUploader onUpload={(path) => setImagePaths(prev => [...prev, path])} />
            {imagePaths.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imagePaths.map((p) => (
                  <div key={p} className="relative group">
                    <StaticImage fileName={p} alt="uploaded" className="h-24 w-full rounded-md object-cover" />
                    <button type="button" onClick={() => setImagePaths(prev => prev.filter(ip => ip !== p))} className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pricing & Stock */}
          <section className="rounded-md border border-white/10 p-4 bg-black/20 backdrop-blur-md">
            <h3 className="text-base font-semibold text-white mb-3">Pricing & stock</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="priceDisplay">Price</label>
                <input
                  id="priceDisplay"
                  type="number"
                  step="0.01"
                  min={0}
                  value={priceDisplay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceDisplay(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-orange-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Currency</label>
                <div className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-zinc-200">AED</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="stock">Stock</label>
                <input id="stock" type="number" min={0} value={stockInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockInput(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-2">If you add variants, a default variant won’t be created.</p>
          </section>

          {/* Product type */}
          <section className="rounded-md border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Product type</h3>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input type="checkbox" checked={hasVariants} onChange={(e)=> setHasVariants(e.target.checked)} />
                Has variants
              </label>
            </div>
          </section>

          {/* Options */}
          {hasVariants && (
          <>
          <section className="rounded-md border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Options</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => addOptionPreset('Size', ['XS','S','M','L','XL'])} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">Preset: Size</button>
                <button type="button" onClick={() => addOptionPreset('Color', ['Red','Blue','Black','White'])} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">Preset: Color</button>
                <button type="button" onClick={() => setOptions(prev => [...prev, { id: crypto.randomUUID(), name: '', values: [], newValue: '' }])} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">+ Add option</button>
              </div>
            </div>
            {options.length === 0 ? (
              <div className="text-sm text-zinc-400">Add options (e.g., Size, Color) and values, then generate variants.</div>
            ) : (
              <div className="space-y-3">
                {options.map((opt) => (
                  <div key={opt.id} className="rounded border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input value={opt.name} onChange={(e)=> setOptions(prev => prev.map(o => o.id===opt.id ? { ...o, name: e.target.value } : o))} placeholder="Option name" className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded text-sm" />
                      <button type="button" onClick={()=> setOptions(prev => prev.filter(o => o.id!==opt.id))} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">Remove</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {opt.values.map((v, i) => (
                        <span key={`${opt.id}-${i}`} className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-white/10">
                          {v}
                          <button type="button" onClick={()=> setOptions(prev => prev.map(o => o.id===opt.id ? { ...o, values: o.values.filter(x => x!==v) } : o))} className="text-zinc-400 hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input value={opt.newValue} onChange={(e)=> setOptions(prev => prev.map(o => o.id===opt.id ? { ...o, newValue: e.target.value } : o))} placeholder="Add a value" className="px-3 py-2 bg-black/30 border border-white/10 rounded text-sm" />
                      <button type="button" onClick={()=> { const val = (opt.newValue || '').trim(); if (!val) return; setOptions(prev => prev.map(o => o.id===opt.id ? { ...o, values: [...o.values, val], newValue: '' } : o)); }} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">+ Add value</button>
                    </div>
                  </div>
                ))}
                <div>
                  <button type="button" onClick={generateVariantsFromOptions} className="rounded border border-white/10 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2">Generate variants</button>
                </div>
              </div>
            )}
          </section>

          {/* Variants */}
          <section className="rounded-md border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Variants</h3>
              <button type="button" onClick={()=> setVariants(prev => [...prev, { id: crypto.randomUUID(), sku: '', priceCents, stock, attrText: '' }])} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">+ Add variant</button>
            </div>
            {variants.length === 0 ? (
              <div className="text-sm text-zinc-400">No variants yet.</div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <VariantRow key={v.id} idx={i} v={v} optDefs={options.map(o => ({ name: o.name, values: o.values }))} onChange={(nv)=> setVariants(prev => prev.map(x => x.id===v.id ? nv : x))} onRemove={()=> setVariants(prev => prev.filter(x => x.id!==v.id))} />
                ))}
              </div>
            )}
          </section>
          </>
          )}

          {/* Organization */}
          <section className="rounded-md border border-white/10 p-4">
            <h3 className="text-base font-semibold text-white mb-3">Organization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormSelect label="Status" id="status" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED")}> 
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </FormSelect>
              <div className="sm:col-span-2">
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
                      <button key={c.id} type="button" className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10" onClick={() => setCategoryIds((prev) => [...prev, c.id])}>+ {c.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="flex items-center gap-3">
            <button type="submit" onClick={() => setStatus('DRAFT')} className="px-4 py-2 rounded border border-white/10 text-zinc-200 hover:bg-white/5 font-semibold bg-gradient-to-r from-red-500/20 to-orange-500/20" disabled={submitting || !shop}>
              Save as draft
            </button>
            <button type="submit" onClick={() => setStatus('PUBLISHED')} className="px-4 py-2 rounded text-white font-semibold bg-gradient-to-r from-red-500/40 via-orange-500/40 to-red-500/40 hover:from-red-500/50 hover:to-orange-500/50" disabled={submitting || !shop}>
              Publish
            </button>
          </section>
        </form>
      )}
    </main>
  );
}
