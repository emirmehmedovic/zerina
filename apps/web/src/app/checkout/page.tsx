"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

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
    <main>
      <h1 className="text-3xl font-bold mb-4">Checkout</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-base card-glass p-4">
          <div className="text-lg font-semibold mb-2">Shipping address</div>
          {loadingSaved ? (
            <div className="text-sm text-light-muted dark:text-dark-muted mb-2">Loading saved addresses…</div>
          ) : saved.length > 0 ? (
            <div className="mb-3">
              <label className="block text-sm mb-1">Use a saved address</label>
              <select
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
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
          <div className="grid gap-3">
            <input className="input" placeholder="Street" value={shipping.street} onChange={(e) => setShipping({ ...shipping, street: e.target.value })} required />
            <input className="input" placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
            <input className="input" placeholder="Postal code" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} required />
            <input className="input" placeholder="Country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} required />
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={saveShipping} onChange={(e)=>setSaveShipping(e.target.checked)} /> Save this shipping address</label>
        </div>
        <div className="card-base card-glass p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Billing address</div>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} /> Same as shipping
            </label>
          </div>
          {!sameAsShipping && saved.length > 0 && (
            <div className="mb-3">
              <label className="block text-sm mb-1">Use a saved address</label>
              <select
                className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
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
          <div className="grid gap-3 opacity-100">
            <input className="input" placeholder="Street" value={sameAsShipping ? shipping.street : billing.street} onChange={(e) => setBilling({ ...billing, street: e.target.value })} disabled={sameAsShipping} required />
            <input className="input" placeholder="City" value={sameAsShipping ? shipping.city : billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} disabled={sameAsShipping} required />
            <input className="input" placeholder="Postal code" value={sameAsShipping ? shipping.postalCode : billing.postalCode} onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })} disabled={sameAsShipping} required />
            <input className="input" placeholder="Country" value={sameAsShipping ? shipping.country : billing.country} onChange={(e) => setBilling({ ...billing, country: e.target.value })} disabled={sameAsShipping} required />
          </div>
          {!sameAsShipping && (
            <label className="mt-3 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={saveBilling} onChange={(e)=>setSaveBilling(e.target.checked)} /> Save this billing address</label>
          )}
        </div>
        <div className="md:col-span-2 flex items-center justify-end">
          <button className="btn-primary">Continue to review</button>
        </div>
      </form>
    </main>
  );
}
