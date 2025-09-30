"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import GlobalHeroBackground from "@/components/ui/global-hero-background";

export default function LoginPage() {
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Login failed (${res.status})`);
      }
      push({ type: "success", title: "Signed in", message: "Welcome back!" });
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
      push({ type: "error", title: "Login failed", message: err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <GlobalHeroBackground />
      <div className="w-full max-w-md z-10">
        <form onSubmit={onSubmit} className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-zinc-400">Sign in to continue to your account.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor="password">Password</label>
                <a href="/forgot" className="text-sm text-blue-400 hover:text-blue-300">Forgot?</a>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full px-4 py-2.5 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors" disabled={loading}>
            {loading ? "Signing In…" : "Sign In"}
          </button>

          <p className="mt-4 text-sm text-center text-zinc-400">
            Don't have an account? <a className="font-semibold text-blue-400 hover:text-blue-300" href="/register">Register</a>
          </p>
        </form>
      </div>
    </main>
  );
}
