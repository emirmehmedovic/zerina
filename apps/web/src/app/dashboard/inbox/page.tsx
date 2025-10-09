"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type Conversation = {
  id: string;
  shopId: string;
  productId?: string | null;
  lastMessageAt: string;
  participants: { userId: string; role: "CUSTOMER" | "VENDOR"; lastReadAt: string }[];
  messages?: { id: string; body: string; createdAt: string }[];
};

export default function InboxListPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/conversations`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json().catch(() => ({}));
      const list: Conversation[] = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      {error && <div className="text-sm text-rose-500 mb-3">{error}</div>}
      {loading ? (
        <div className="text-sm text-zinc-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-zinc-400">No conversations yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const last = c.messages?.[0];
            return (
              <Link key={c.id} href={`/dashboard/inbox/${c.id}`} className="block rounded border border-white/10 bg-black/20 backdrop-blur-md p-3 hover:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Conversation</div>
                  <div className="text-xs text-zinc-400">{new Date(c.lastMessageAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-zinc-300 mt-1 line-clamp-1">{last?.body || "No messages yet"}</div>
                <div className="text-[11px] text-zinc-400 mt-1">shop: {c.shopId}{c.productId ? ` • product: ${c.productId}` : ""}</div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
