"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center p-6 bg-light-background dark:bg-dark-background">
      <form onSubmit={onSubmit} className="w-full max-w-md card-base card-hover">
        <h1 className="text-2xl font-bold mb-4">Prijava</h1>
        {error && (
          <div className="mb-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="w-full border border-light-border dark:border-dark-border rounded-md px-3 py-2 bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            className="w-full border border-light-border dark:border-dark-border rounded-md px-3 py-2 bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Prijava..." : "Prijavi se"}
        </button>
        <div className="mt-3 text-center">
          <a href="/forgot" className="text-sm underline underline-offset-4">Forgot password?</a>
        </div>
        <p className="mt-4 text-sm text-light-muted dark:text-dark-muted">
          Nemaš račun? <a className="text-light-accent" href="/register">Registruj se</a>
        </p>
      </form>
    </main>
  );
}
