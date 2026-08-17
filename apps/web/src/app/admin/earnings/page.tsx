"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  Store,
  CreditCard,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

type ShopBreakdown = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  revenue: number;
  platformFee: number;
  vendorPayout: number;
  orders: number;
};

type DailyData = {
  date: string;
  revenue: number;
  platformFee: number;
};

type RecentPayment = {
  id: string;
  amountCents: number;
  platformFeeCents: number;
  transferAmountCents: number;
  currency: string;
  createdAt: string;
  shopName: string;
};

type EarningsResponse = {
  period: string;
  totals: {
    totalRevenue: number;
    platformFees: number;
    vendorPayouts: number;
    transactionCount: number;
  };
  shopBreakdown: ShopBreakdown[];
  dailyBreakdown: DailyData[];
  recentPayments: RecentPayment[];
};

const formatCurrency = (cents: number, currency = "EUR") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

export default function AdminEarningsPage() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchEarnings = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/earnings?period=${selectedPeriod}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings(period);
  }, [period]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading earnings data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
        {error}
        <button
          onClick={() => fetchEarnings(period)}
          className="ml-4 text-rose-200 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const totals = data?.totals ?? { totalRevenue: 0, platformFees: 0, vendorPayouts: 0, transactionCount: 0 };

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-lg p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-400" /> Platform Earnings
          </h1>
          <p className="text-sm text-zinc-400">
            Track revenue, platform fees, and vendor payouts across all shops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={() => fetchEarnings(period)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total Revenue</span>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.totalRevenue)}</div>
          <div className="mt-1 text-xs text-zinc-500">{totals.transactionCount} transactions</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Platform Fees</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-100">{formatCurrency(totals.platformFees)}</div>
          <div className="mt-1 text-xs text-emerald-400/70">Your earnings</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Vendor Payouts</span>
            <Store className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.vendorPayouts)}</div>
          <div className="mt-1 text-xs text-zinc-500">Transferred to vendors</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Fee Rate</span>
            <CreditCard className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {totals.totalRevenue > 0
              ? ((totals.platformFees / totals.totalRevenue) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="mt-1 text-xs text-zinc-500">Average commission</div>
        </div>
      </section>

      {/* Shop Breakdown */}
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-purple-400" /> Earnings by Shop
        </h2>
        {data?.shopBreakdown && data.shopBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-400">
                  <th className="pb-3 font-medium">Shop</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">Platform Fee</th>
                  <th className="pb-3 font-medium text-right">Vendor Payout</th>
                  <th className="pb-3 font-medium text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.shopBreakdown.map((shop) => (
                  <tr key={shop.shopId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white font-medium">{shop.shopName}</td>
                    <td className="py-3 text-right text-zinc-300">{formatCurrency(shop.revenue)}</td>
                    <td className="py-3 text-right text-emerald-400">{formatCurrency(shop.platformFee)}</td>
                    <td className="py-3 text-right text-zinc-300">{formatCurrency(shop.vendorPayout)}</td>
                    <td className="py-3 text-right text-zinc-400">{shop.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No shop earnings data for this period.</p>
        )}
      </section>

      {/* Recent Payments */}
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-400" /> Recent Transactions
        </h2>
        {data?.recentPayments && data.recentPayments.length > 0 ? (
          <div className="space-y-3">
            {data.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4"
              >
                <div>
                  <div className="text-white font-medium">{payment.shopName}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(payment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">{formatCurrency(payment.amountCents, payment.currency)}</div>
                  <div className="text-xs text-emerald-400">
                    +{formatCurrency(payment.platformFeeCents, payment.currency)} fee
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No recent transactions.</p>
        )}
      </section>
    </main>
  );
}
