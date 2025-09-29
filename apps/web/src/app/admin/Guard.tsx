"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, { credentials: "include" });
        if (!res.ok) throw new Error("unauthenticated");
        const me = await res.json();
        if (cancelled) return;
        if (me?.role !== "ADMIN") {
          router.replace("/");
        }
      } catch {
        if (!cancelled) router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
