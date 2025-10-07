"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function VendorBlogListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch only vendor's posts by calling public list with authorId=me (API doesn't have me shortcut), so fallback: get me, then list
        const meRes = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) throw new Error("unauthenticated");
        const me = await meRes.json();
        const listRes = await fetch(`${API_URL}/api/v1/blog?authorId=${encodeURIComponent(me.id)}&take=50&status=DRAFT`, { credentials: 'include', cache: 'no-store' });
        const pubRes = await fetch(`${API_URL}/api/v1/blog?authorId=${encodeURIComponent(me.id)}&take=50&status=PUBLISHED`, { credentials: 'include', cache: 'no-store' });
        const list = listRes.ok ? (await listRes.json()).items ?? [] : [];
        const pub = pubRes.ok ? (await pubRes.json()).items ?? [] : [];
        const merged = [...list, ...pub].sort((a:any,b:any)=>new Date(b.createdAt||b.publishedAt||0).getTime()-new Date(a.createdAt||a.publishedAt||0).getTime());
        if (active) setItems(merged);
      } catch (e:any) {
        if (active) setError(e?.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Artisan Chronicles</h1>
            <p className="text-zinc-400 mt-1">Create and manage your vendor blog posts.</p>
          </div>
          <Link
            href="/dashboard/blog/new"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors"
          >
            New Post
          </Link>
        </div>

        {/* Content card */}
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 overflow-hidden">
          {loading && (
            <div className="p-5 text-zinc-300">Loading…</div>
          )}
          {error && (
            <div className="p-5 text-rose-400">{error}</div>
          )}
          {!loading && !error && (
            <>
              {items.length === 0 ? (
                <div className="p-6 text-zinc-300">No posts yet.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {items.map((p:any) => (
                    <div key={p.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">{p.title}</div>
                        <div className="text-xs text-zinc-400">
                          {p.status}
                          <span className="mx-2">•</span>
                          {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.slug && (
                          <Link
                            href={`/artisan-chronicles/${p.slug}`}
                            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 text-sm"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/blog/${p.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15 text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
