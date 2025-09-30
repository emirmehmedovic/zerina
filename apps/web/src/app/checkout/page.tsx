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
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-400 via-zinc-300 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-zinc-900 dark:text-zinc-100 tracking-tight">
            Checkout
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            Complete your purchase
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-base card-glass p-6 group relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/10 to-teal-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Shipping Address</div>
          </div>
          {loadingSaved ? (
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Loading saved addresses…</div>
          ) : saved.length > 0 ? (
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Use a saved address</label>
              <select
                className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/10 backdrop-blur-sm dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
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
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Street Address</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" placeholder="123 Main St" value={shipping.street} onChange={(e) => setShipping({ ...shipping, street: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">City</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" placeholder="New York" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Postal Code</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" placeholder="10001" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Country</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" placeholder="United States" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} required />
            </div>
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer">
            <input type="checkbox" checked={saveShipping} onChange={(e)=>setSaveShipping(e.target.checked)} className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500/50" /> 
            Save this shipping address
          </label>
        </div>
        <div className="card-base card-glass p-6 group relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200/10 to-blue-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                <CreditCard className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Billing Address</div>
            </div>
            <label className="text-sm flex items-center gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} className="rounded border-white/20 text-sky-600 focus:ring-sky-500/50" /> Same as shipping
            </label>
          </div>
          {!sameAsShipping && saved.length > 0 && (
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Use a saved address</label>
              <select
                className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/10 backdrop-blur-sm dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
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
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Street Address</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="123 Main St" value={sameAsShipping ? shipping.street : billing.street} onChange={(e) => setBilling({ ...billing, street: e.target.value })} disabled={sameAsShipping} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">City</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="New York" value={sameAsShipping ? shipping.city : billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} disabled={sameAsShipping} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Postal Code</label>
                <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="10001" value={sameAsShipping ? shipping.postalCode : billing.postalCode} onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })} disabled={sameAsShipping} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Country</label>
              <input className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder="United States" value={sameAsShipping ? shipping.country : billing.country} onChange={(e) => setBilling({ ...billing, country: e.target.value })} disabled={sameAsShipping} required />
            </div>
          </div>
          {!sameAsShipping && (
            <label className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer">
              <input type="checkbox" checked={saveBilling} onChange={(e)=>setSaveBilling(e.target.checked)} className="rounded border-white/20 text-sky-600 focus:ring-sky-500/50" /> 
              Save this billing address
            </label>
          )}
        </div>
        <div className="md:col-span-2 flex items-center justify-end">
          <button className="btn-primary">Continue to review</button>
        </div>
      </form>
      </div>
    </main>
  );
}
