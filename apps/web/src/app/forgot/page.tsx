"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function ForgotPasswordPage() {
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDevResetUrl(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      push({ type: "success", title: "Email sent", message: "If an account exists, you'll receive a reset link." });
      if (body?.resetUrl) setDevResetUrl(body.resetUrl);
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Request failed", message: err.message });
      } else {
        push({ type: "error", title: "Request failed", message: "Unknown error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card-base card-glass">
        <h1 className="text-2xl font-bold mb-4">Forgot password</h1>
        <p className="text-sm text-light-muted dark:text-dark-muted mb-4">Enter your email to receive a reset link.</p>
        <div className="mb-4">
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button>
        {devResetUrl && (
          <div className="mt-3 text-xs">
            Dev link: <a className="underline" href={devResetUrl}>{devResetUrl}</a>
          </div>
        )}
      </form>
    </main>
  );
}
