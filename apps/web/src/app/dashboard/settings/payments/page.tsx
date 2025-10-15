"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Loader2, RefreshCw, ShieldCheck, Wallet, ArrowUpRight, AlertTriangle } from "lucide-react";

interface StripeStatusResponse {
  connected: boolean;
  payouts_enabled?: boolean;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: string[];
  default_currency?: string | null;
}

export default function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StripeStatusResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/stripe/status`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setStatus(body as StripeStatusResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Stripe status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/stripe/connect`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.url) throw new Error(body?.error || "Unable to start onboarding");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate Stripe onboarding");
    } finally {
      setConnecting(false);
    }
  };

  const handleDashboardLink = async () => {
    setOpeningDashboard(true);
    setError(null);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/stripe/dashboard-link`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.url) throw new Error(body?.error || "Unable to open Stripe dashboard");
      window.open(body.url, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open Stripe dashboard");
    } finally {
      setOpeningDashboard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading Stripe status…
        </div>
      </div>
    );
  }

  const connected = Boolean(status?.connected);
  const requirements = status?.requirements ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments &amp; Stripe Connect</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Connect your Stripe Express account to receive payouts from marketplace orders.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Stripe account status</h2>
              <p className="text-xs text-zinc-400">Keep your payout account details up to date.</p>
            </div>
          </div>

          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5/10 p-4">
              <dt className="text-zinc-500 uppercase tracking-wide text-xs">Connection</dt>
              <dd className="mt-1 text-white font-medium flex items-center gap-2">
                {connected ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Connected to Stripe Express
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Not connected
                  </>
                )}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5/10 p-4">
              <dt className="text-zinc-500 uppercase tracking-wide text-xs">Payouts</dt>
              <dd className="mt-1 text-white font-medium">
                {status?.payouts_enabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5/10 p-4">
              <dt className="text-zinc-500 uppercase tracking-wide text-xs">Charges</dt>
              <dd className="mt-1 text-white font-medium">
                {status?.charges_enabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5/10 p-4">
              <dt className="text-zinc-500 uppercase tracking-wide text-xs">Default currency</dt>
              <dd className="mt-1 text-white font-medium uppercase">
                {status?.default_currency || "–"}
              </dd>
            </div>
          </dl>

          {requirements.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Additional information required
              </div>
              <ul className="space-y-1 list-disc list-inside pl-2">
                {requirements.map((req) => (
                  <li key={req} className="text-amber-50/90 text-xs sm:text-sm">
                    {req.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Actions</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Use these actions to connect or manage your Stripe Express account.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-purple-500 transition disabled:opacity-60"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {connected ? "Reconnect Stripe" : "Connect with Stripe"}
          </button>

          <button
            onClick={handleDashboardLink}
            disabled={openingDashboard || !connected}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 transition disabled:opacity-60"
          >
            {openingDashboard ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            Open Stripe Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
