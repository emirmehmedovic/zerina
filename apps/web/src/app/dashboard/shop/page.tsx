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
    <main>
      <h1 className="text-3xl font-bold mb-6">Shop Management</h1>
      <Suspense fallback={<LoadingState />}>
        <ShopDashboardClient initialShop={shop} />
      </Suspense>
    </main>
  );
}

