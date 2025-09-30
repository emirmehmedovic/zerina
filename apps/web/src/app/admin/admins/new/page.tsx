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
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Admin</h1>
          <p className="text-zinc-400">Onboard a new administrator to the platform.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={onSubmit} className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6 space-y-4">
          <FormInput label="Full Name" id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g., Ada Lovelace" required />
          <FormInput label="Email Address" id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          <FormInput label="Password" id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="••••••••" required />
          
          <div className="pt-2">
            <button type="submit" className="w-full px-4 py-2.5 rounded-lg border border-transparent bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors" disabled={loading}>
              <UserPlus size={16} />
              {loading ? "Creating Account…" : "Create Admin Account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
