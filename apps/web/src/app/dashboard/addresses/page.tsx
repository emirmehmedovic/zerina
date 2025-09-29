"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

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
    } catch (e: any) {
      setError(e?.message || "Failed to load addresses");
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
    } catch (e: any) {
      alert(e?.message || 'Failed to add address');
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
    } catch (e: any) {
      alert(e?.message || 'Failed to delete');
    }
  };

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">My Addresses</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base card-glass p-4">
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">No saved addresses.</div>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id} className="border border-light-glass-border rounded-md p-3 flex items-center justify-between">
                  <div className="text-sm">{a.street}, {a.city} {a.postalCode}, {a.country}</div>
                  <button className="text-sm underline underline-offset-4 text-rose-600" onClick={() => onDelete(a.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-base card-glass p-4 h-fit">
          <div className="text-lg font-semibold mb-2">Add new address</div>
          <form onSubmit={onAdd} className="grid gap-3">
            <input className="input" placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
            <input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <input className="input" placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
            <input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
