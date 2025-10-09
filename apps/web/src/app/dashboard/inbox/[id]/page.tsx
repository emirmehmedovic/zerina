"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export default function InboxDetailPage() {
  const { id } = useParams() as { id: string };
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const load = async (after?: string | null) => {
    try {
      const q = after ? `?after=${encodeURIComponent(after)}` : "";
      const res = await fetch(`${API_URL}/api/v1/chat/conversations/${id}/messages${q}`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const newItems: Message[] = Array.isArray(data?.items) ? data.items : [];
      if (newItems.length) {
        setItems(prev => {
          const map = new Map(prev.map(m => [m.id, m]));
          for (const m of newItems) map.set(m.id, m);
          return Array.from(map.values()).sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        setLastFetchedAt(newItems[newItems.length - 1].createdAt);
        // mark read
        const csrf = await getCsrfToken();
        fetch(`${API_URL}/api/v1/chat/conversations/${id}/read`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf } as any }).catch(()=>{});
      }
    } catch (e: any) {
      setError(e?.message || 'failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load current user id for labeling
    (async () => {
      try {
        const meRes = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          setMeId(me?.id || null);
        }
      } catch {}
    })();
    setItems([]);
    setLoading(true);
    setError(null);
    load();
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => load(lastFetchedAt), 5000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const el = listRef.current; if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items.length]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const csrf = await getCsrfToken();
    const res = await fetch(`${API_URL}/api/v1/chat/conversations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      credentials: 'include',
      body: JSON.stringify({ body: text }),
    });
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (!res.ok) return;
    const msg = await res.json();
    setItems(prev => [...prev, msg]);
    setLastFetchedAt(msg.createdAt);
  };

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Conversation</h1>
        <Link href="/dashboard/inbox" className="text-sm text-zinc-300 underline">Back to Inbox</Link>
      </div>
      {error && <div className="text-sm text-rose-500 mb-3">{error}</div>}
      <div className="rounded border border-white/10 bg-black/20 backdrop-blur-md p-3">
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading && items.length === 0 ? (
            <div className="text-sm text-zinc-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-400">No messages yet.</div>
          ) : (
            items.map(m => {
              const isMine = meId && m.senderId === meId;
              return (
                <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded text-zinc-100 ${isMine ? 'ml-auto bg-blue-500/20 border border-blue-400/30 text-blue-50' : 'mr-auto bg-white/10 border border-white/10'}`}>
                  <div className="text-[10px] mb-0.5 opacity-70">{isMine ? 'You (Vendor)' : 'Customer'}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e)=> setInput(e.target.value)}
            onKeyDown={(e)=> { if (e.key === 'Enter') send(); }}
            placeholder="Type a message"
            className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10 text-sm text-zinc-100"
          />
          <button onClick={send} disabled={!input.trim()} className="px-3 py-2 rounded bg-white/10 text-white text-sm border border-white/10 disabled:opacity-50">Send</button>
        </div>
      </div>
    </main>
  );
}
