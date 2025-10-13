"use client";

import { useEffect, useState } from "react";
import CreateShopForm from "@/app/dashboard/shop/CreateShopForm";
import { Shop } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Store, Shield, Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api";

export default function BecomeSellerClient() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  // Inline account state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountErr, setAccountErr] = useState<string | null>(null);
  const onGoogle = () => {
    const redirect = `${window.location.origin}/become-a-seller`;
    window.location.href = `${API_URL}/api/v1/auth/google/start?redirect=${encodeURIComponent(redirect)}`;
  };

  const handleCreated = (s: Shop) => {
    setShop(s);
    router.push("/dashboard/shop");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' });
        if (res.ok) {
          const u = await res.json();
          if (!cancelled) setMe(u);
        } else {
          if (!cancelled) setMe(null);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const beforeCreate = async () => {
    if (me) return;
    setAccountErr(null);
    if (!email || !password) throw new Error('Please enter email and password');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name: name || undefined })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.error || `Registration failed (${res.status})`;
      setAccountErr(msg);
      throw new Error(msg);
    }
    try {
      const meRes = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' });
      if (meRes.ok) setMe(await meRes.json());
    } catch {}
  };

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/70 border border-rose-200/70 text-amber-900 text-xs font-semibold mb-3">
            <Sparkles className="w-4 h-4" />
            Open your storefront
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-900">Become a Seller</h1>
          <p className="text-amber-900/80 mt-2 max-w-2xl">Create a beautiful shop, list your products, and reach customers who value handmade.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Benefits / Guidance */}
          <section className="lg:col-span-1 card-base card-glass p-5 ring-1 ring-rose-200/40 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-rose-600" />
              <div className="text-lg font-semibold text-amber-900">Why sell with us</div>
            </div>
            <ul className="space-y-3 text-amber-900/90 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" />
                Elegant storefront with minimal setup
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" />
                Manage products, orders, and analytics
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" />
                Chat with customers in your inbox
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-2 text-xs text-amber-900/70">
              <Shield className="w-4 h-4" />
              Your account will be upgraded to vendor automatically when you create a shop.
            </div>
          </section>

          {/* Right: Form */}
          <section className="lg:col-span-2">
            <div className="relative card-base card-glass p-5 md:p-6 ring-1 ring-rose-200/40 rounded-2xl overflow-hidden">
              {/* Decorative background orbs */}
              <div aria-hidden className="pointer-events-none absolute -top-10 -right-12 w-60 h-60 rounded-full bg-amber-100/50 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-rose-100/40 blur-3xl" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-rose-100/70 ring-1 ring-rose-200/70">
                    <Store className="w-4 h-4 text-rose-600" />
                  </span>
                  <div>
                    <div className="text-lg font-semibold text-amber-900">Create your shop</div>
                    <div className="text-xs text-amber-900/70">It only takes a minute to get started</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-rose-200/60 to-transparent mb-4" />

              {/* Inline account creation if not signed in */}
              {!meLoading && !me && (
                <div className="mb-5 rounded-xl p-4 ring-1 ring-rose-200/60 bg-rose-50/50">
                  <div className="text-sm font-medium mb-2 text-amber-900">Create your account</div>
                  {accountErr && <div className="mb-3 text-sm text-red-700">{accountErr}</div>}
                  <div className="mb-4">
                    <button type="button" onClick={onGoogle} className="w-full px-4 py-2.5 rounded-lg border border-rose-200 bg-white/80 text-amber-900 font-semibold hover:bg-white transition-colors">
                      Continue with Google
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-amber-900/80" htmlFor="acc_name">Full name (optional)</label>
                      <input id="acc_name" value={name} onChange={(e)=> setName(e.target.value)} className="w-full rounded-md px-3 py-2 bg-white/85 focus:bg-white border border-rose-200/60 focus:ring-2 focus:ring-rose-200/80 outline-none transition" placeholder="e.g., Ada Lovelace" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-amber-900/80" htmlFor="acc_email">Email</label>
                      <input id="acc_email" type="email" required value={email} onChange={(e)=> setEmail(e.target.value)} className="w-full rounded-md px-3 py-2 bg-white/85 focus:bg-white border border-rose-200/60 focus:ring-2 focus:ring-rose-200/80 outline-none transition" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-amber-900/80" htmlFor="acc_password">Password</label>
                      <input id="acc_password" type="password" required value={password} onChange={(e)=> setPassword(e.target.value)} minLength={8} className="w-full rounded-md px-3 py-2 bg-white/85 focus:bg-white border border-rose-200/60 focus:ring-2 focus:ring-rose-200/80 outline-none transition" placeholder="********" />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-amber-900/70">Password must be at least 8 characters.</div>
                </div>
              )}

              <div className="relative z-10">
                <CreateShopForm onShopCreated={handleCreated} beforeCreate={beforeCreate} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
