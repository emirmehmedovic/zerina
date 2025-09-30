"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Plus, Edit, Trash2 } from 'lucide-react';

type Addr = { id: string; street: string; city: string; postalCode: string; country: string };

export default function MyAddressesPage() {
  const [items, setItems] = useState<Addr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Addr>({ id: "", street: "", city: "", postalCode: "", country: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/addresses`, { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems(body.items || []);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ street: form.street, city: form.city, postalCode: form.postalCode, country: form.country }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setForm({ id: "", street: "", city: "", postalCode: "", country: "" });
      load();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unknown error occurred');
      }
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
          <h1 className="text-2xl font-bold text-white">Address Hub</h1>
          <p className="text-zinc-400">Manage your shipping and billing addresses.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Address</h3>
          <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormInput label="Street Address" id="street" placeholder="123 Main St" value={form.street} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, street: e.target.value })} required />
            </div>
            <FormInput label="City" id="city" placeholder="Anytown" value={form.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, city: e.target.value })} required />
            <FormInput label="Postal Code" id="postalCode" placeholder="12345" value={form.postalCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, postalCode: e.target.value })} required />
            <div className="md:col-span-2">
              <FormInput label="Country" id="country" placeholder="United States" value={form.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, country: e.target.value })} required />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors" disabled={saving}>
                <Plus size={18} />
                {saving ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Saved Addresses</h3>
          {loading ? (
            <div className="text-center p-10 text-zinc-500">Loading addresses...</div>
          ) : error ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center p-10 rounded-2xl bg-black/20 border border-white/10 text-zinc-500">No saved addresses.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((a) => (
                <div key={a.id} className="group relative rounded-2xl bg-black/20 border border-white/10 p-5">
                  <div className="font-semibold text-white">{a.street}</div>
                  <div className="text-zinc-400">{a.city}, {a.postalCode}</div>
                  <div className="text-zinc-500">{a.country}</div>
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 rounded-full px-1 py-1">
                    <button onClick={() => alert('Edit not implemented')} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"><Edit size={16} /></button>
                    <button onClick={() => onDelete(a.id)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
