"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { UserPlus } from 'lucide-react';

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
      push({ type: "success", title: "Admin created", message: `New admin account for ${body.email} created.` });
      setEmail("");
      setPassword("");
      setName("");
    } catch (e: unknown) {
       if (e instanceof Error) {
        push({ type: "error", title: "Create failed", message: e.message });
      } else {
        push({ type: "error", title: "Create failed", message: "An unknown error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  const FormInput = ({ label, id, ...props }: { label: string; id: string; [key: string]: unknown }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor={id}>{label}</label>
      <input
        id={id}
        {...props}
        className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
      />
    </div>
  );

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-orange-300 to-transparent rounded-full" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">Create New Admin</h1>
          <p className="text-zinc-300 text-sm">Onboard a new administrator to the platform.</p>
        </div>

        {/* Form card */}
        <form onSubmit={onSubmit} className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6 space-y-4">
          <FormInput label="Full Name" id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g., Ada Lovelace" required />
          <FormInput label="Email Address" id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          <FormInput label="Password" id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="••••••••" required />

          <div className="pt-2">
            <button
              type="submit"
              className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-sm border border-white/10 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 hover:from-red-500/40 hover:to-orange-500/40 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              <UserPlus size={16} />
              {loading ? "Creating Account…" : "Create Admin Account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
