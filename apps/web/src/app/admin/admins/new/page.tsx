"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function AdminCreateAdminPage() {
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/admin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      push({ type: "success", title: "Admin created", message: `${body.email}` });
      setEmail("");
      setPassword("");
      setName("");
    } catch (e: any) {
      push({ type: "error", title: "Create failed", message: e?.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Admin · Create admin account</h1>
      <form onSubmit={onSubmit} className="max-w-md card-base card-glass p-4 grid gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">Name</label>
          <input id="name" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input id="password" type="password" className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create admin"}</button>
      </form>
    </main>
  );
}
