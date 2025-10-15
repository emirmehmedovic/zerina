import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { Shop } from "@/lib/types";
import ShopDashboardClient from "./ShopDashboardClient";
import { Suspense } from "react";

async function getShopData(): Promise<Shop | null> {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${API_URL}/api/v1/shops/mine`, {
      headers: { Cookie: cookieStore.toString() },
      next: { tags: ["shop"] }, // Add tag for revalidation
    });
    if (res.ok) {
      return (await res.json()) as Shop;
    }
    return null;
  } catch {
    return null;
  }
}

function LoadingState() {
  return <p className="text-light-muted dark:text-dark-muted">Loading shop details...</p>;
}

export default async function DashboardShopPage() {
  const shop = await getShopData();

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-black/30 p-6 md:p-8 text-zinc-100 shadow-lg shadow-blue-500/5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
          Shop Management
        </div>
        <div className="mt-4 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Manage your storefront</h1>
          <p className="max-w-3xl text-sm text-zinc-300">
            Configure how your shop appears to customers, review its status, and jump into product creation once you are approved.
          </p>
        </div>
      </section>

      <Suspense fallback={<LoadingState />}>
        <ShopDashboardClient initialShop={shop} />
      </Suspense>
    </main>
  );
}

