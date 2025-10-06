"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import ImageUploader from "@/components/ImageUploader";
import { ArrowLeft, CheckCircle2, ImageIcon } from "lucide-react";

// NOTE: We try to fetch the vendor's own shop. If /shops/me is unavailable, we try a fallback.
async function fetchMyShop(): Promise<{
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: { storageKey: string } | null;
  coverUrl?: string | null;
} | null> {
  try {
    // Use Next proxy which forwards cookies
    const res = await fetch(`/api/vendor/shops/mine`, { cache: "no-store" });
    if (res.ok) {
      const raw = await res.json();
      if (!raw || typeof raw !== 'object') return raw;
      // If cover fields are missing, fetch full shop detail (public)
      let storageKey: string | null = raw?.coverImage?.storageKey 
        || raw?.coverImageStorageKey 
        || raw?.coverImagePath 
        || raw?.coverImageKey 
        || null;
      let coverUrl: string | null = raw?.coverUrl || null;
      if (!storageKey && !coverUrl && raw?.id) {
        try {
          const full = await fetch(`/api/v1/shops/${raw.id}`, { cache: 'no-store' });
          if (full.ok) {
            const fr = await full.json();
            storageKey = fr?.coverImage?.storageKey 
              || fr?.coverImageStorageKey 
              || fr?.coverImagePath 
              || fr?.coverImageKey 
              || storageKey;
            coverUrl = fr?.coverUrl || coverUrl;
          }
        } catch {}
      }
      return {
        ...raw,
        coverImage: storageKey ? { storageKey } : null,
        coverUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function ShopAppearancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<Awaited<ReturnType<typeof fetchMyShop>>>(null);

  // Local cover state (storageKey path from uploader or absolute URL)
  const [coverPath, setCoverPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const s = await fetchMyShop();
      if (!active) return;
      setShop(s);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const resolvedCoverUrl = useMemo(() => {
    const currentKey = shop?.coverImage?.storageKey || "";
    const currentUrl = shop?.coverUrl || null;
    const candidate = coverPath ?? currentUrl ?? (currentKey ? currentKey : null);
    if (!candidate) return null;
    if (candidate.startsWith("http")) return candidate;
    if (candidate.startsWith("/uploads/")) return `${API_URL}${candidate}`;
    if (candidate.startsWith("uploads/")) return `${API_URL}/${candidate}`;
    return `${API_URL}/uploads/${candidate}`;
  }, [coverPath, shop]);

  const onUpload = (path: string) => {
    setCoverPath(path);
    setSaved(false);
  };

  const onSave = async () => {
    if (!shop) return;
    setSaving(true);
    setError(null);
    try {
      const body: any = {};
      if (coverPath) {
        if (coverPath.startsWith("http")) {
          // Save as explicit URL if absolute
          body.coverUrl = coverPath;
          body.coverImage = null;
          body.coverImageStorageKey = null;
        } else {
          // Save as storageKey; backend can map it to a file reference
          body.coverImage = { storageKey: coverPath };
          // Also provide a flat storageKey for backends expecting primitive
          body.coverImageStorageKey = coverPath;
          // Clear any explicit coverUrl
          body.coverUrl = null;
        }
      }
      // Use Next proxy which forwards cookies
      const res = await fetch(`/api/vendor/shops/${shop.id}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        throw new Error(details?.error || `Failed to save cover image (${res.status})`);
      }
      // Prefer upstream response if it includes cover fields
      const updatedRaw = await res.json().catch(() => null);
      if (updatedRaw && typeof updatedRaw === 'object') {
        const storageKey: string | null = updatedRaw?.coverImage?.storageKey 
          || updatedRaw?.coverImageStorageKey 
          || updatedRaw?.coverImagePath 
          || updatedRaw?.coverImageKey 
          || null;
        const coverUrlResp: string | null = updatedRaw?.coverUrl || null;
        setShop({
          ...(updatedRaw as any),
          coverImage: storageKey ? { storageKey } : null,
          coverUrl: coverUrlResp,
        });
      } else {
        // Fallback: refetch latest shop to ensure UI reflects saved cover
        const refreshed = await fetchMyShop();
        setShop(refreshed);
      }
      setSaved(true);
      // Clear local path once persisted
      setCoverPath(null);
    } catch (e: any) {
      setError(e?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/shop" className="inline-flex items-center gap-2 text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Shop</span>
          </Link>
        </div>
        {saved && (
          <div className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6">Shop Appearance</h1>

      {loading ? (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6 text-zinc-300">Loading…</div>
      ) : !shop ? (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6 text-red-300">Could not load your shop.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview card */}
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <div className="mb-4">
              <h2 className="text-sm uppercase tracking-wider text-zinc-400">Cover Preview</h2>
            </div>
            <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden">
              {resolvedCoverUrl ? (
                <Image
                  src={resolvedCoverUrl}
                  alt="Shop cover preview"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                  <div className="inline-flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">No cover selected</span>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
            </div>
          </div>

          {/* Uploader + actions card */}
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <h2 className="text-sm uppercase tracking-wider text-zinc-400 mb-3">Upload Cover</h2>
            <p className="text-xs text-zinc-500 mb-3">Recommended: 1200×400px, JPG/PNG/WebP, max 2MB</p>
            <ImageUploader onUpload={onUpload} />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={saving || !shop}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-zinc-200 hover:bg-white/10 transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {error && <span className="text-sm text-red-400">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
