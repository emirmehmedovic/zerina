"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { MapPin, CreditCard, Package } from "lucide-react";

export default function CheckoutAddressPage() {
  const router = useRouter();
  const [shipping, setShipping] = useState({ street: "", city: "", postalCode: "", country: "" });
  const [billing, setBilling] = useState({ street: "", city: "", postalCode: "", country: "" });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [saved, setSaved] = useState<Array<{ id: string; street: string; city: string; postalCode: string; country: string }>>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saveShipping, setSaveShipping] = useState(false);
  const [saveBilling, setSaveBilling] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingSaved(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/addresses`, { credentials: "include" });
        const body = await res.json().catch(() => ({}));
        if (res.ok) setSaved(body.items || []);
      } catch {}
      setLoadingSaved(false);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = sameAsShipping ? shipping : billing;
    // Optionally persist addresses
    try {
      if (saveShipping) {
        await fetch(`${API_URL}/api/v1/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...shipping }),
        });
      }
      if (saveBilling && !sameAsShipping) {
        await fetch(`${API_URL}/api/v1/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...b }),
        });
      }
    } catch {}
    // Store in sessionStorage for the review step
    try {
      sessionStorage.setItem("checkout:shipping", JSON.stringify(shipping));
      sessionStorage.setItem("checkout:billing", JSON.stringify(b));
    } catch {}
    router.push("/checkout/review");
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Enhanced header */}
        <div className="mb-10 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 via-amber-300 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-amber-900 dark:text-amber-900 tracking-tight">
            Checkout
          </h1>
          <p className="text-amber-900 dark:text-amber-900 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
            Complete your purchase
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-base card-glass p-6 group relative overflow-hidden rounded-2xl ring-1 ring-rose-200/40 dark:ring-rose-400/20">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-200/10 via-amber-200/10 to-rose-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          {/* Inner border glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(244,114,182,0.10)]" />
          
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                <Package className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-amber-900 dark:text-amber-900">Shipping Address</div>
                <div className="text-xs text-amber-900 dark:text-amber-900">Where should we send your order?</div>
              </div>
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full bg-rose-100/70 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200/50 dark:border-rose-400/20">Step 1</span>
          </div>
          <div aria-hidden className="h-px w-full bg-gradient-to-r from-rose-200/50 via-amber-200/50 to-rose-200/50 rounded-full mb-4" />
          {loadingSaved ? (
            <div className="text-sm text-amber-900 dark:text-amber-900 mb-2">Loading saved addresses…</div>
          ) : saved.length > 0 ? (
            <div className="mb-5 relative">
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Use a saved address</label>
              <select
                className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/20 backdrop-blur-sm dark:bg-rose-900/20 text-amber-900 dark:text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40 transition-all"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const a = saved.find((s) => s.id === val);
                  if (a) setShipping({ street: a.street, city: a.city, postalCode: a.postalCode, country: a.country });
                }}
              >
                <option value="">Choose saved address…</option>
                {saved.map((a) => (
                  <option key={a.id} value={a.id}>{a.street}, {a.city} {a.postalCode}, {a.country}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="relative grid gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Street Address</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40 transition-all" placeholder="123 Main St" value={shipping.street} onChange={(e) => setShipping({ ...shipping, street: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">City</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40 transition-all" placeholder="New York" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Postal Code</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40 transition-all" placeholder="10001" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Country</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/40 transition-all" placeholder="United States" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} required />
            </div>
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-amber-900 dark:text-amber-900 cursor-pointer">
            <input type="checkbox" checked={saveShipping} onChange={(e)=>setSaveShipping(e.target.checked)} className="rounded border-white/20 text-rose-600 focus:ring-rose-400/50" /> 
            Save this shipping address
          </label>
        </div>
        <div className="card-base card-glass p-6 group relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-200/10 via-amber-200/10 to-rose-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-amber-900 dark:text-amber-900">Billing Address</div>
                <div className="text-xs text-amber-900 dark:text-amber-900">Use the same as shipping or enter a different one.</div>
              </div>
            </div>
            <label className="text-sm flex items-center gap-2 text-amber-900 dark:text-amber-900 cursor-pointer">
              <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} className="rounded border-white/20 text-amber-600 focus:ring-amber-400/50" /> Same as shipping
            </label>
          </div>
          <div aria-hidden className="h-px w-full bg-gradient-to-r from-rose-200/50 via-amber-200/50 to-rose-200/50 rounded-full mb-4" />
          {!sameAsShipping && saved.length > 0 && (
            <div className="mb-5 relative">
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Use a saved address</label>
              <select
                className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/20 backdrop-blur-sm dark:bg-amber-950/20 text-amber-900 dark:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all"
                disabled={sameAsShipping}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const a = saved.find((s) => s.id === val);
                  if (a) setBilling({ street: a.street, city: a.city, postalCode: a.postalCode, country: a.country });
                }}
              >
                <option value="">Choose saved address…</option>
                {saved.map((a) => (
                  <option key={a.id} value={a.id}>{a.street}, {a.city} {a.postalCode}, {a.country}</option>
                ))}
              </select>
            </div>
          )}
          <div className="relative grid gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Street Address</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="123 Main St" value={sameAsShipping ? shipping.street : billing.street} onChange={(e) => setBilling({ ...billing, street: e.target.value })} disabled={sameAsShipping} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">City</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="New York" value={sameAsShipping ? shipping.city : billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} disabled={sameAsShipping} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Postal Code</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="10001" value={sameAsShipping ? shipping.postalCode : billing.postalCode} onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })} disabled={sameAsShipping} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-900 mb-2">Country</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/30 backdrop-blur-sm dark:bg-rose-900/25 text-amber-900 dark:text-amber-900 placeholder-amber-700/50 dark:placeholder-amber-100/30 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="United States" value={sameAsShipping ? shipping.country : billing.country} onChange={(e) => setBilling({ ...billing, country: e.target.value })} disabled={sameAsShipping} required />
            </div>
          </div>
          {!sameAsShipping && (
            <label className="mt-4 inline-flex items-center gap-2 text-sm text-amber-900 dark:text-amber-900 cursor-pointer">
              <input type="checkbox" checked={saveBilling} onChange={(e)=>setSaveBilling(e.target.checked)} className="rounded border-white/20 text-amber-600 focus:ring-amber-400/50" /> 
              Save this billing address
            </label>
          )}
        </div>
        <div className="md:col-span-2 flex items-center justify-end">
          <button
            type="submit"
            className="group relative rounded-xl px-5 py-3 font-semibold text-amber-900 dark:text-amber-900 shadow-sm ring-1 ring-rose-200/60 dark:ring-rose-400/20 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 dark:from-rose-500/20 dark:via-amber-400/20 dark:to-rose-500/20 hover:from-rose-100 dark:hover:from-rose-500/30 hover:to-amber-100 dark:hover:to-amber-400/30 transition-colors"
          >
            Continue to review
            <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(244,114,182,0.25)_inset]" />
          </button>
        </div>
      </form>
      </div>
    </main>
  );
}
