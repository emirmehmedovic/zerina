"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

 type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  ownerId: string;
  _count?: { products: number };
  products: Array<{
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    stock: number;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
    images?: { storageKey: string }[];
    createdAt: string;
  }>;
};

export default function AdminShopDetailPage() {
  const params = useParams<{ id: string }>();
  const { push } = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<false | Shop["status"]>(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/shops/id/${params.id}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as Shop;
      setShop(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load shop");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const setStatus = async (status: Shop["status"]) => {
    if (!shop) return;
    setUpdating(status);
    try {
      const res = await fetch(`${API_URL}/api/v1/shops/${shop.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setShop({ ...shop, status });
      push({ type: "success", title: "Updated", message: `Shop → ${status}` });
    } catch (e: any) {
      push({ type: "error", title: "Update failed", message: e?.message || "Unknown error" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <main className="p-6">Loading...</main>;
  if (error || !shop) return <main className="p-6">{error || "Not found"}</main>;

  return (
    <main>
      <div className="mb-6 card-base card-glass p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">{shop.name}</h1>
            <div className="text-sm text-light-muted dark:text-dark-muted">/{shop.slug} · Owner: {shop.ownerId}</div>
          </div>
          <div className="flex items-center gap-2">
            <a className="btn-secondary" href={`/shops/${shop.slug}`}>View public</a>
            <a className="btn-secondary" href={`/admin/inventory?shopId=${shop.id}`}>View inventory</a>
          </div>
        </div>
        <div className="mt-3 text-sm text-light-muted dark:text-dark-muted">{shop.description}</div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm">Status: <span className="font-medium">{shop.status}</span></span>
          {shop.status !== "ACTIVE" && (
            <button className="btn-secondary" disabled={!!updating} onClick={() => setStatus("ACTIVE")}>{updating === "ACTIVE" ? "Saving…" : "Approve"}</button>
          )}
          {shop.status !== "SUSPENDED" && (
            <button className="btn-secondary" disabled={!!updating} onClick={() => setStatus("SUSPENDED")}>{updating === "SUSPENDED" ? "Saving…" : "Suspend"}</button>
          )}
          {shop.status !== "CLOSED" && (
            <button className="btn-secondary" disabled={!!updating} onClick={() => setStatus("CLOSED")}>{updating === "CLOSED" ? "Saving…" : "Close"}</button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto card-base card-glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Image</th>
              <th className="py-2">Title</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Status</th>
              <th className="py-2">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shop.products.map((p) => (
              <tr key={p.id} className="border-t border-light-glass-border">
                <td className="py-2 pr-2">
                  {p.images && p.images.length > 0 ? (
                    <img src={`${API_URL}${p.images[0].storageKey}`} alt={p.title} className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-black/10 dark:bg-white/10" />
                  )}
                </td>
                <td className="py-2 pr-2">{p.title}</td>
                <td className="py-2 pr-2">{(p.priceCents/100).toFixed(2)} {p.currency}</td>
                <td className="py-2 pr-2">{p.stock}</td>
                <td className="py-2 pr-2">{p.status}</td>
                <td className="py-2 pr-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <a className="underline underline-offset-4" href={`/dashboard/products/${p.id}/edit`}>Edit</a>
                    <a className="underline underline-offset-4" href={`/products/${p.slug}`}>View</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
