"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import GlobalHeroBackground from "@/components/ui/global-hero-background";

export default function RegisterPage() {
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Register failed (${res.status})`);
      }
      push({ type: "success", title: "Account created", message: "You are now signed in." });
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        push({ type: "error", title: "Register failed", message: err.message });
      } else {
        setError("Register failed");
        push({ type: "error", title: "Register failed", message: "Unknown error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background without hero image to match homepage */}
      <GlobalHeroBackground useImage={false} />

      {/* Animated SVG ornaments from /public/svgs (same as login) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <img src="/svgs/1.svg" alt="" className="absolute opacity-[0.20] animate-float-slow select-none" style={{ top: '6%', left: '4%', width: '220px' }} />
        <img src="/svgs/2.svg" alt="" className="absolute opacity-[0.18] animate-drift select-none" style={{ bottom: '10%', left: '12%', width: '260px' }} />
        <img src="/svgs/3.svg" alt="" className="absolute opacity-[0.16] animate-float select-none" style={{ top: '12%', right: '8%', width: '280px' }} />
        {/* Swap positions: 5.svg to bottom-right, 4.svg to center */}
        <img src="/svgs/5.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden md:block" style={{ bottom: '6%', right: '4%', width: '320px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/4.svg" alt="" className="absolute opacity-[0.14] animate-drift-slow select-none" style={{ top: '40%', left: '50%', transform: 'translateX(-50%)', width: '360px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        {/* Newly added SVGs */}
        <img src="/svgs/7.svg" alt="" className="absolute opacity-[0.10] animate-drift-slow select-none hidden sm:block" style={{ top: '18%', left: '18%', width: '260px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/8.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden lg:block" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: '300px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/9.svg" alt="" className="absolute opacity-[0.08] animate-float-slow select-none hidden xl:block" style={{ top: '8%', right: '24%', width: '340px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
      </div>

      <div className="w-full max-w-md z-10">
        <form onSubmit={onSubmit} className="rounded-2xl bg-white/75 backdrop-blur-md border border-amber-100 p-8 space-y-6 shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-900">Create your account</h1>
            <p className="text-amber-900/70">Join our platform today.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900 placeholder:text-amber-900/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ada Lovelace"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900 placeholder:text-amber-900/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900 placeholder:text-amber-900/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition-colors" disabled={loading}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>

          <p className="mt-4 text-sm text-center text-amber-900/70">
            Already have an account? <a className="font-semibold text-amber-900 hover:underline" href="/login">Sign In</a>
          </p>
        </form>
      </div>
      {/* Styled-JSX animations (shared with login) */}
      <style jsx global>{`
        @keyframes float { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(0.2deg); } 100% { transform: translateY(0) rotate(0deg); } }
        @keyframes float-slow { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-0.2deg); } 100% { transform: translateY(0) rotate(0deg); } }
        @keyframes drift { 0% { transform: translateX(0) translateY(0) rotate(0deg); } 50% { transform: translateX(8px) translateY(-6px) rotate(0.2deg); } 100% { transform: translateX(0) translateY(0) rotate(0deg); } }
        @keyframes drift-slow { 0% { transform: translateX(0) translateY(0) rotate(0deg); } 50% { transform: translateX(-6px) translateY(-4px) rotate(-0.2deg); } 100% { transform: translateX(0) translateY(0) rotate(0deg); } }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 16s ease-in-out infinite; }
        .animate-drift { animation: drift 14s ease-in-out infinite; }
        .animate-drift-slow { animation: drift-slow 20s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
