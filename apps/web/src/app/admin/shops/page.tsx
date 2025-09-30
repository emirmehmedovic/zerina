"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { Search, CheckCircle, XCircle, AlertTriangle, Eye, Store, ShieldCheck, ShieldAlert, ShieldClose } from 'lucide-react';

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  ownerId: string;
};

const statusConfig: Record<Shop['status'], { label: string; icon: React.ElementType; color: string; }> = {
  PENDING_APPROVAL: { label: "Pending", icon: ShieldAlert, color: "text-yellow-400" },
  ACTIVE: { label: "Active", icon: ShieldCheck, color: "text-emerald-400" },
  SUSPENDED: { label: "Suspended", icon: ShieldClose, color: "text-rose-500" },
  CLOSED: { label: "Closed", icon: XCircle, color: "text-zinc-500" },
};

export default function AdminShopsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Shop[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/v1/shops`);
      if (statusFilter) url.searchParams.set("status", statusFilter);
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
  }, [statusFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Shops Launchpad</h1>
          <p className="text-zinc-400">Manage and review all shops on the platform.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search by shop name or slug..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            className="w-full border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-zinc-500">Loading shops...</div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 p-6 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const StatusIcon = statusConfig[s.status].icon;
            const statusColor = statusConfig[s.status].color;
            return (
              <div key={s.id} className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Store className="text-zinc-500" size={20} />
                      <h3 className="font-bold text-white text-lg">{s.name}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${statusColor} bg-white/5`}>
                      <StatusIcon size={14} />
                      <span>{statusConfig[s.status].label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4 ml-8">/{s.slug}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <a className="flex-1 text-center px-3 py-2 text-sm rounded-lg border border-white/10 bg-black/20 text-zinc-200 hover:bg-white/5 font-semibold flex items-center justify-center gap-2 transition-colors" href={`/shops/${s.slug}`}><Eye size={16} /> View</a>
                  {s.status !== "ACTIVE" && (
                    <button className="flex-1 text-center px-3 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold transition-colors" onClick={() => setShopStatus(s.id, "ACTIVE")}>Approve</button>
                  )}
                  {s.status !== "SUSPENDED" && (
                    <button className="flex-1 text-center px-3 py-2 text-sm rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-semibold transition-colors" onClick={() => setShopStatus(s.id, "SUSPENDED")}>Suspend</button>
                  )}
                  {s.status !== "CLOSED" && (
                    <button className="flex-1 text-center px-3 py-2 text-sm rounded-lg bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 font-semibold transition-colors" onClick={() => setShopStatus(s.id, "CLOSED")}>Close</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
