"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Calendar,
  Package,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import Link from "next/link";

type DailyData = {
  date: string;
  revenue: number;
  earnings: number;
  orders: number;
};

type RecentOrder = {
  id: string;
  totalCents: number;
  discountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentAmount: number;
  platformFee: number;
  earnings: number;
};

type EarningsResponse = {
  period: string;
  shop: { id: string; name: string };
  totals: {
    revenue: number;
    platformFees: number;
    earnings: number;
    orderCount: number;
    pendingPayout: number;
  };
  dailyBreakdown: DailyData[];
  recentOrders: RecentOrder[];
};

const formatCurrency = (cents: number, currency = "EUR") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

const statusColors: Record<string, string> = {
  PROCESSING: "text-amber-400",
  SHIPPED: "text-blue-400",
  DELIVERED: "text-emerald-400",
  CANCELLED: "text-rose-400",
  REFUNDED: "text-zinc-400",
};

export default function VendorEarningsPage() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchEarnings = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/earnings?period=${selectedPeriod}`, {
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

  const totals = data?.totals ?? { revenue: 0, platformFees: 0, earnings: 0, orderCount: 0, pendingPayout: 0 };

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-lg p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-400" /> My Earnings
          </h1>
          <p className="text-sm text-zinc-400">
            Track your revenue, platform fees, and payouts for {data?.shop?.name ?? "your shop"}.
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
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total Sales</span>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.revenue)}</div>
          <div className="mt-1 text-xs text-zinc-500">{totals.orderCount} orders</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Your Earnings</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-100">{formatCurrency(totals.earnings)}</div>
          <div className="mt-1 text-xs text-emerald-400/70">After platform fees</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Platform Fees</span>
            <CreditCard className="h-5 w-5 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.platformFees)}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {totals.revenue > 0
              ? ((totals.platformFees / totals.revenue) * 100).toFixed(1)
              : 0}% of sales
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-300">Pending Payout</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-100">{formatCurrency(totals.pendingPayout)}</div>
          <div className="mt-1 text-xs text-amber-400/70">Processing orders</div>
        </div>
      </section>

      {/* Stripe Connect Link */}
      <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" /> Stripe Payouts
            </h3>
            <p className="text-sm text-blue-200/70 mt-1">
              Manage your Stripe account, view detailed payout history, and update banking info.
            </p>
          </div>
          <Link
            href="/dashboard/settings/payments"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition"
          >
            Stripe Settings <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Daily Breakdown */}
      {data?.dailyBreakdown && data.dailyBreakdown.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" /> Daily Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-400">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Sales</th>
                  <th className="pb-3 font-medium text-right">Earnings</th>
                  <th className="pb-3 font-medium text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyBreakdown.slice().reverse().map((day) => (
                  <tr key={day.date} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-3 text-right text-zinc-300">{formatCurrency(day.revenue)}</td>
                    <td className="py-3 text-right text-emerald-400">{formatCurrency(day.earnings)}</td>
                    <td className="py-3 text-right text-zinc-400">{day.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent Orders */}
      <section className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-400" /> Recent Orders
        </h2>
        {data?.recentOrders && data.recentOrders.length > 0 ? (
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4"
              >
                <div>
                  <div className="text-white font-medium flex items-center gap-2">
                    Order #{order.id.slice(-8)}
                    <span className={`text-xs uppercase ${statusColors[order.status] ?? "text-zinc-400"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">{formatCurrency(order.paymentAmount, order.currency)}</div>
                  <div className="text-xs text-emerald-400">
                    +{formatCurrency(order.earnings, order.currency)} earnings
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No recent orders.</p>
        )}
      </section>
    </main>
  );
}
