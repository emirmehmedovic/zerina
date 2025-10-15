"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { useToast } from "@/components/ToastProvider";
import type { VendorDocument } from "@/types/vendor";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldClose,
  User,
} from "lucide-react";

const statusBadges: Record<"PENDING" | "APPROVED" | "REJECTED", { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  APPROVED: { label: "Approved", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  REJECTED: { label: "Rejected", className: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
};

const identityBadges: Record<
  "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED",
  { label: string; className: string; icon: React.ElementType }
> = {
  NOT_REQUIRED: { label: "Not required", className: "bg-white/5 text-zinc-300 border-white/10", icon: ShieldAlert },
  PENDING: { label: "Verification pending", className: "bg-amber-500/15 text-amber-300 border-amber-500/40", icon: AlertTriangle },
  VERIFIED: { label: "Verified", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", icon: ShieldCheck },
  FAILED: { label: "Failed", className: "bg-rose-500/15 text-rose-300 border-rose-500/40", icon: ShieldClose },
};

const documentUrl = (storageKey: string) => `${API_URL}/uploads/${storageKey}`;

type VendorApplicationItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  legalName: string;
  country: string;
  submittedAt: string;
  reviewedAt: string | null;
  notes: string | null;
  rejectionReason: string | null;
  identityVerificationStatus: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  identityVerificationProvider: string | null;
  identityVerificationCheckedAt: string | null;
  identityVerificationNotes: string | null;
  user: { email: string | null; name: string | null };
  reviewedBy: { email: string | null; name: string | null } | null;
  vendorDocuments: VendorDocument[];
};

type FetchResponse = { items: VendorApplicationItem[]; total: number };

type DecisionState = Record<string, { notes: string; rejectionReason: string }>;

type FilterStatus = "" | "PENDING" | "APPROVED" | "REJECTED";

export default function VendorApplicationsAdminPage() {
  const { push } = useToast();
  const [items, setItems] = useState<VendorApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("PENDING");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<DecisionState>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/v1/admin/vendor-applications`);
      if (statusFilter) url.searchParams.set("status", statusFilter);
      if (query.trim()) url.searchParams.set("q", query.trim());
      const res = await fetch(url.toString(), { credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as FetchResponse | { error?: string };
      if (!res.ok) {
        throw new Error((body as { error?: string })?.error || `Failed (${res.status})`);
      }
      const data = body as FetchResponse;
      setItems(data.items || []);
      const nextDecisions: DecisionState = {};
      for (const item of data.items || []) {
        nextDecisions[item.id] = {
          notes: item.notes ?? "",
          rejectionReason: item.rejectionReason ?? "",
        };
      }
      setDecisions(nextDecisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const email = item.user.email?.toLowerCase() ?? "";
      const legal = item.legalName.toLowerCase();
      return legal.includes(q) || email.includes(q);
    });
  }, [items, query]);

  const updateDecisionField = (id: string, field: "notes" | "rejectionReason", value: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: {
        notes: prev[id]?.notes ?? "",
        rejectionReason: prev[id]?.rejectionReason ?? "",
        [field]: value,
      },
    }));
  };

  const handleDecision = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    const decision = decisions[id] ?? { notes: "", rejectionReason: "" };
    if (newStatus === "REJECTED" && !decision.rejectionReason.trim()) {
      push({ type: "error", title: "Reason required", message: "Provide a rejection reason before rejecting." });
      return;
    }

    try {
      setSavingId(id);
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/admin/vendor-applications/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          status: newStatus,
          notes: decision.notes.trim() || undefined,
          rejectionReason: decision.rejectionReason.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setItems((prev) => prev.map((item) => (item.id === id ? body.application : item)));
      push({ type: "success", title: "Updated", message: `Application ${newStatus.toLowerCase()}.` });
    } catch (err) {
      push({ type: "error", title: "Update failed", message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setSavingId(null);
    }
  };

  const refreshSingle = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/vendor-applications?take=1&skip=0&id=${id}`, { credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json().catch(() => ({}))) as FetchResponse;
      if (body.items?.length) {
        setItems((prev) => prev.map((item) => (item.id === id ? body.items[0] : item)));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-lg p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-rose-300" /> Vendor applications
          </h1>
          <p className="text-sm text-zinc-400">Review vendor onboarding requests, check uploaded documents, and approve or reject applications.</p>
        </div>
        <button
          type="button"
          onClick={loadApplications}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by legal name or email…"
              className="w-full rounded-lg border border-white/10 bg-black/25 py-2 pl-10 pr-4 text-sm text-white focus:border-rose-400 focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
          <select
            className="w-full rounded-lg border border-white/10 bg-black/25 py-2 px-3 text-sm text-white focus:border-rose-400 focus:ring-2 focus:ring-rose-500/50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </section>

      {loading && !items.length ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-zinc-400">Loading applications…</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-zinc-400">No applications found.</div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const badge = statusBadges[item.status];
            const decision = decisions[item.id] ?? { notes: "", rejectionReason: "" };
            const identity = identityBadges[item.identityVerificationStatus];
            const isExpanded = expanded === item.id;
            return (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur p-5">
                <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{item.legalName}</h2>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                      <span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-zinc-500" />{item.user.name ?? "Unknown"}</span>
                      <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-zinc-500" />{item.user.email ?? "No email"}</span>
                      <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-500" />{item.country}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span>Submitted {new Date(item.submittedAt).toLocaleString()}</span>
                      {item.reviewedAt && <span>· Reviewed {new Date(item.reviewedAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                  </div>
                </header>

                {isExpanded && (
                  <div className="mt-5 space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Identity verification</h3>
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${identity.className}`}>
                        <identity.icon className="h-3.5 w-3.5" />
                        {identity.label}
                      </div>
                      {item.identityVerificationProvider && (
                        <p className="text-xs text-zinc-400">Provider: {item.identityVerificationProvider}</p>
                      )}
                      {item.identityVerificationNotes && (
                        <p className="text-xs text-zinc-400">Notes: {item.identityVerificationNotes}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Uploaded documents</h3>
                      {(item.vendorDocuments?.length ?? 0) ? (
                        <ul className="grid gap-2 md:grid-cols-2">
                          {(item.vendorDocuments ?? []).map((doc) => (
                            <li key={doc.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-200">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-white break-all">{doc.originalName}</p>
                                  <p className="text-xs text-zinc-400">
                                    {doc.mimeType} · {(doc.sizeBytes / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleString()}
                                  </p>
                                </div>
                                <a
                                  href={documentUrl(doc.storageKey)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                                >
                                  View
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded-lg border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                          No documents uploaded yet.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Internal notes</label>
                        <textarea
                          value={decision.notes}
                          onChange={(e) => updateDecisionField(item.id, "notes", e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white focus:border-rose-400 focus:ring-2 focus:ring-rose-500/40"
                          placeholder="Internal notes for this application"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Rejection reason</label>
                        <textarea
                          value={decision.rejectionReason}
                          onChange={(e) => updateDecisionField(item.id, "rejectionReason", e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white focus:border-rose-400 focus:ring-2 focus:ring-rose-500/40"
                          placeholder="Provide a reason if rejecting"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, "APPROVED")}
                        disabled={savingId === item.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {savingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(item.id, "REJECTED")}
                        disabled={savingId === item.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
                      >
                        {savingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldClose className="h-4 w-4" />}
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
