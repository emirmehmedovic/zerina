"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";

type ChatWidgetProps = {
  productId?: string;
  shopId?: string;
  vendorName?: string;
  onClose?: () => void;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};


export default function ChatWidget({ productId, shopId, vendorName, onClose }: ChatWidgetProps) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const close = () => { setOpen(false); onClose?.(); };

  const ensureConversation = async () => {
    if (convId) return convId;
    setLoading(true);
    try {
      // get current user id
      try {
        const meRes = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          setMeId(me?.id || null);
        }
      } catch {}
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ productId, shopId }),
      });
      if (res.status === 401) {
        // Not logged in
        window.location.href = '/login';
        return null;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `failed (${res.status})`);
      }
      const conv = await res.json();
      setConvId(conv.id);
      // find vendor participant id
      const v = Array.isArray(conv?.participants) ? conv.participants.find((p: any) => p.role === 'VENDOR') : null;
      if (v?.userId) setVendorId(v.userId);
      return conv.id as string;
    } catch (e: any) {
      setError(e?.message || 'failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (cId: string, after?: string | null) => {
    const q = after ? `?after=${encodeURIComponent(after)}` : '';
    const res = await fetch(`${API_URL}/api/v1/chat/conversations/${cId}/messages${q}`, { credentials: 'include', cache: 'no-store' });
    if (res.status === 401) return; // ignore
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const items: Message[] = Array.isArray(data?.items) ? data.items : [];
    if (items.length) {
      setMessages(prev => {
        const map = new Map(prev.map(m => [m.id, m]));
        for (const m of items) map.set(m.id, m);
        return Array.from(map.values()).sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      setLastFetchedAt(items[items.length - 1].createdAt);
      // mark read
      fetch(`${API_URL}/api/v1/chat/conversations/${cId}/read`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': await getCsrfToken() } as any }).catch(()=>{});
    }
  };

  const startPolling = (cId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      fetchMessages(cId, lastFetchedAt);
    }, 5000);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const id = await ensureConversation();
      if (!id || !active) return;
      await fetchMessages(id);
      startPolling(id);
    })();
    return () => {
      active = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!convId) return;
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ body: text }),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) return;
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setLastFetchedAt(msg.createdAt);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] max-w-[90vw] rounded-xl border border-white/10 bg-black/80 backdrop-blur-md shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-white/10">
        <div className="text-sm font-medium text-zinc-100">Chat with {vendorName || 'Vendor'}</div>
        <button onClick={close} className="text-sm text-zinc-300 hover:text-white">×</button>
      </div>
      <div ref={listRef} className="max-h-[320px] overflow-y-auto p-3 space-y-2 text-sm">
        {error && <div className="text-rose-400">{error}</div>}
        {messages.length === 0 && !loading && <div className="text-zinc-400">No messages yet. Say hello 👋</div>}
        {messages.map((m) => {
          const isMine = meId && m.senderId === meId;
          const isVendor = vendorId && m.senderId === vendorId;
          const who = isMine ? 'You' : (isVendor ? 'Vendor' : 'Customer');
          return (
            <div key={m.id} className={`max-w-[85%] px-2 py-1 rounded text-zinc-100 ${isMine ? 'ml-auto bg-blue-500/20 border border-blue-400/30 text-blue-50' : 'mr-auto bg-white/10 border border-white/10'}`}>
              <div className="text-[10px] mb-0.5 opacity-70">{who}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t border-white/10 flex items-center gap-2">
        <input
          value={input}
          onChange={(e)=> setInput(e.target.value)}
          onKeyDown={(e)=> { if (e.key === 'Enter') send(); }}
          placeholder="Type a message"
          className="flex-1 px-2 py-2 rounded bg-black/40 border border-white/10 text-sm text-zinc-100"
        />
        <button onClick={send} disabled={!input.trim()} className="px-3 py-2 rounded bg-white/10 text-white text-sm border border-white/10 disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}
