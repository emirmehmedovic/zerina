"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { useToast } from "@/components/ToastProvider";
import { Plus, RefreshCw, CheckCircle2, Ban, Calendar, Percent } from "lucide-react";

type DiscountCode = {
  id: string;
  code: string;
  description?: string | null;
  percentOff: number;
  expiresAt?: string | null;
  maxUsesPerUser: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  redemptionsCount: number;
};

type CreatePayload = {
  code: string;
  description?: string;
  percentOff: number;
  expiresAt?: string;
  maxUsesPerUser: number;
};

const defaultForm: CreatePayload = {
  code: "",
  description: "",
  percentOff: 10,
  expiresAt: "",
  maxUsesPerUser: 1,
};

export default function DiscountCodesPage() {
  const { push } = useToast();
  const [items, setItems] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreatePayload>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/discount-codes`, { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(Array.isArray(body.items) ? body.items : []);
      } else {
        push({ type: "error", title: "Failed to load", message: body?.error || `Status ${res.status}` });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = useMemo(() => {
    return items.filter((code) => {
      if (!code.expiresAt) return false;
      const expires = new Date(code.expiresAt).getTime();
      if (Number.isNaN(expires)) return false;
      const diff = expires - Date.now();
      return diff > 0 && diff < 1000 * 60 * 60 * 24 * 7;
    }).length;
  }, [items]);

  const onChange = <K extends keyof CreatePayload>(key: K, value: CreatePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      if (!form.code.trim()) {
        setFormError("Code is required.");
        return;
      }
      const payload: CreatePayload = {
        code: form.code.trim(),
        description: form.description?.trim() ? form.description.trim() : undefined,
        percentOff: Number(form.percentOff) || 0,
        expiresAt: form.expiresAt?.trim() ? form.expiresAt : undefined,
        maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
      };
      if (payload.percentOff < 1 || payload.percentOff > 100) {
        setFormError("Discount must be between 1% and 100%.");
        return;
      }
      if (payload.maxUsesPerUser < 1) {
        setFormError("Max uses per user must be at least 1.");
        return;
      }
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/discount-codes`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      push({ type: "success", title: "Discount created", message: payload.code });
      setForm(defaultForm);
      await load();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Unknown error");
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setTogglingId(id);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/discount-codes/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify({ active }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((code) => (code.id === id ? { ...code, active } : code)));
      push({ type: "success", title: "Status updated", message: active ? "Activated" : "Deactivated" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        push({ type: "error", title: "Update failed", message: err.message });
      } else {
        push({ type: "error", title: "Update failed", message: "Unknown error" });
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Discount Codes</h1>
          <p className="text-sm text-zinc-400">Create codes customers can redeem during checkout. Codes are scoped to your shop.</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-200">Code</label>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
                placeholder="SPRING25"
                value={form.code}
                onChange={(e) => onChange("code", e.target.value.toUpperCase())}
                required
              />
              <Plus className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-200">Percent off</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
                value={form.percentOff}
                onChange={(e) => onChange("percentOff", Number(e.target.value))}
                required
              />
              <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-200">Max uses per customer</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              value={form.maxUsesPerUser}
              onChange={(e) => onChange("maxUsesPerUser", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-200">Expires</label>
            <input
              type="date"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              value={form.expiresAt}
              onChange={(e) => onChange("expiresAt", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-200">Description <span className="text-zinc-500">(optional)</span></label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
              placeholder="Free shipping on orders over 50€"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>

          <div className="md:col-span-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-zinc-400">
              Codes are case-insensitive. Expired or deactivated codes cannot be used.
            </div>
            <div className="flex items-center gap-3">
              {formError && <div className="text-sm text-red-400">{formError}</div>}
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Create code
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Existing codes</h2>
            <p className="text-sm text-zinc-400">
              {items.length} {items.length === 1 ? "code" : "codes"} • {upcoming} expiring within 7 days
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-400">Loading codes…</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
            No discount codes yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm text-zinc-300">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Discount</th>
                  <th className="px-4 py-2">Max uses</th>
                  <th className="px-4 py-2">Usage</th>
                  <th className="px-4 py-2">Expires</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((code) => {
                  const expiresLabel = code.expiresAt
                    ? new Date(code.expiresAt).toLocaleDateString()
                    : "—";
                  return (
                    <tr key={code.id}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-base text-white">{code.code}</div>
                        {code.description && (
                          <div className="text-xs text-zinc-500">{code.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                          <Percent className="h-3 w-3" />
                          {code.percentOff}%
                        </div>
                      </td>
                      <td className="px-4 py-3">{code.maxUsesPerUser}</td>
                      <td className="px-4 py-3">{code.redemptionsCount}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1 text-zinc-300">
                          <Calendar className="h-3 w-3" />
                          {expiresLabel}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {code.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-red-200">
                            <Ban className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleActive(code.id, !code.active)}
                          disabled={togglingId === code.id}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-60"
                        >
                          {code.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
