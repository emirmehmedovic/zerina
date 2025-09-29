"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { push } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = params.get("token");
    if (t) setToken(t);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      push({ type: "success", title: "Password changed", message: "You are now signed in." });
      router.push("/");
      router.refresh();
    } catch (err: any) {
      push({ type: "error", title: "Reset failed", message: err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="card-base card-glass">Missing or invalid token.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card-base card-glass">
        <h1 className="text-2xl font-bold mb-4">Reset password</h1>
        <div className="mb-6">
          <label className="block text-sm mb-1" htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            required
            className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</button>
        <div className="mt-3 text-center">
          <a href="/login" className="text-sm underline underline-offset-4">Back to login</a>
        </div>
      </form>
    </main>
  );
}
