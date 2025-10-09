"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { LogOut, LayoutDashboard, Shield, User, ShoppingBag, MapPin, Settings } from "lucide-react";

type Me = {
  id: string;
  email: string;
  name: string | null;
  role: "BUYER" | "VENDOR" | "ADMIN";
};

function Avatar({ name, email }: { name: string | null; email: string }) {
  const label = (name || email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-white/30 dark:bg-zinc-800/40 border border-white/20 text-white flex items-center justify-center text-xs font-semibold">
      {label}
    </div>
  );
}

export default function HeaderAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as Me;
          if (!cancelled) setMe(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const inTrigger = !!triggerRef.current && !!t && triggerRef.current.contains(t);
      const inMenu = !!menuRef.current && !!t && menuRef.current.contains(t);
      if (inTrigger || inMenu) return; // ignore clicks inside
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Position dropdown next to trigger using viewport coordinates
  useEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const MENU_WIDTH = 256; // w-64
    const GAP = 8;
    const left = Math.max(8, Math.min(window.innerWidth - 8 - MENU_WIDTH, rect.right - MENU_WIDTH));
    const top = Math.min(window.innerHeight - 8, rect.bottom + GAP);
    setCoords({ top, left });

    const onResize = () => {
      const r = el.getBoundingClientRect();
      const l = Math.max(8, Math.min(window.innerWidth - 8 - MENU_WIDTH, r.right - MENU_WIDTH));
      const t = Math.min(window.innerHeight - 8, r.bottom + GAP);
      setCoords({ top: t, left: l });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  const logout = async () => {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setMe(null);
    if (typeof window !== "undefined") window.location.href = "/";
  };

  if (loading) return null;

  if (!me) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="inline-flex items-center h-9 px-4 rounded-full bg-white/20 hover:bg-white/30 text-amber-900 border border-white/30 transition">Sign in</Link>
        <Link href="/register" className="inline-flex items-center h-9 px-4 rounded-full bg-amber-900 hover:bg-amber-950 text-white border border-amber-900 transition">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 text-sm text-amber-900"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={me.name} email={me.email} />
        <span className="hidden sm:inline text-amber-900 max-w-[140px] truncate">{me.name ?? me.email}</span>
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          className="w-64 card-base card-glass p-3 z-[1000] shadow-2xl"
          style={{ position: 'fixed', top: coords.top, left: coords.left }}
          role="menu"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-light-glass-border text-amber-900">
            <Avatar name={me.name} email={me.email} />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{me.name ?? me.email}</div>
              <div className="text-xs text-amber-800 capitalize">{me.role.toLowerCase()}</div>
            </div>
          </div>

          <div className="py-2 text-sm">
            {me.role === 'VENDOR' && (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded text-amber-900 hover:bg-white/20">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/dashboard/products" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/30 dark:hover:bg-zinc-800/30">
                  <ShoppingBag className="h-4 w-4" /> <span className="text-amber-900">My products</span>
                </Link>
                <Link href="/dashboard/analytics" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded text-amber-900 hover:bg-white/20">
                  <Shield className="h-4 w-4" /> Analytics
                </Link>
              </>
            )}
            {me.role === 'ADMIN' && (
              <Link href="/admin/shops" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded text-amber-900 hover:bg-white/20">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
            {me.role === 'BUYER' && (
              <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded text-amber-900 hover:bg-white/20">
                <User className="h-4 w-4" /> Account
              </Link>
            )}
          </div>

          <button onClick={logout} className="w-full inline-flex items-center gap-2 justify-center h-9 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 text-amber-900 mt-1">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
