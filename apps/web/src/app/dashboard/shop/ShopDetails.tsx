"use client";

import { Shop } from "@/lib/types";
import type { ShopStatus } from "@prisma/client";
import Link from "next/link";
import { ExternalLink, PlusCircle } from "lucide-react";

interface ShopDetailsProps {
  shop: Shop;
}

export default function ShopDetails({ shop }: ShopDetailsProps) {
  const statusMeta = (() => {
    const status = shop.status as ShopStatus;
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          badge: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40",
          description: "Your shop is live and visible to customers.",
        };
      case "PENDING_APPROVAL":
        return {
          label: "Pending approval",
          badge: "bg-amber-500/20 text-amber-200 border border-amber-400/40",
          description: "We’re reviewing your application before the shop goes live.",
        };
      case "SUSPENDED":
        return {
          label: "Suspended",
          badge: "bg-red-500/20 text-red-200 border border-red-400/40",
          description: "Shop visibility is paused. Resolve outstanding issues to resume.",
        };
      case "CLOSED":
        return {
          label: "Closed",
          badge: "bg-zinc-500/20 text-zinc-200 border border-zinc-400/40",
          description: "Shop is closed. You can reopen it from settings when ready.",
        };
      default:
        return {
          label: shop.status,
          badge: "bg-white/10 text-zinc-200 border border-white/20",
          description: "",
        };
    }
  })();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 text-zinc-100 shadow-lg shadow-blue-500/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Current shop</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{shop.name}</h2>
          <p className="mt-2 text-sm text-zinc-300">
            {statusMeta.description || "Keep your profile updated so customers always know what to expect."}
          </p>
        </div>
        <span className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.badge}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Description</p>
          <p className="mt-2 text-sm text-zinc-200">
            {shop.description || "Add a short introduction to tell shoppers what your store is about."}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Public link</p>
          <Link href={`/shops/${shop.slug}`} className="mt-2 inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white">
            /shops/{shop.slug}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-6">
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500"
        >
          <PlusCircle className="h-4 w-4" />
          Create product
        </Link>
        <Link
          href={`/shops/${shop.slug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </Link>
      </div>
    </section>
  );
}
