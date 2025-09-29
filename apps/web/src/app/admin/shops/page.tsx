"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

 type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  ownerId: string;
};

export default function AdminShopsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Shop[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/v1/shops`);
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(
    () => items.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.includes(q.toLowerCase())),
    [items, q]
  );

  const setShopStatus = async (id: string, newStatus: Shop["status"]) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/shops/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      push({ type: "success", title: "Updated", message: `Shop → ${newStatus}` });
    } catch (e: any) {
      push({ type: "error", title: "Update failed", message: e?.message || "Unknown error" });
    }
  };

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Admin · Shops</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
          />
          <select
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="card-base card-glass">Loading...</div>
      ) : error ? (
        <div className="card-base card-glass">{error}</div>
      ) : (
        <div className="overflow-x-auto card-base card-glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2">Name</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-light-glass-border">
                  <td className="py-2 pr-2">{s.name}</td>
                  <td className="py-2 pr-2">/{s.slug}</td>
                  <td className="py-2 pr-2">{s.status}</td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <a className="underline underline-offset-4" href={`/shops/${s.slug}`}>View</a>
                      {s.status !== "ACTIVE" && (
                        <button className="underline underline-offset-4" onClick={() => setShopStatus(s.id, "ACTIVE")}>Approve</button>
                      )}
                      {s.status !== "SUSPENDED" && (
                        <button className="underline underline-offset-4" onClick={() => setShopStatus(s.id, "SUSPENDED")}>Suspend</button>
                      )}
                      {s.status !== "CLOSED" && (
                        <button className="underline underline-offset-4" onClick={() => setShopStatus(s.id, "CLOSED")}>Close</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
