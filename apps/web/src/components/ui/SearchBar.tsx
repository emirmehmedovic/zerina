"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState<string>("");

  useEffect(() => {
    const initial = params?.get("query") || "";
    setQ(initial);
  }, [params]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    const url = query ? `/products?query=${encodeURIComponent(query)}` : "/products";
    router.push(url);
  };

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`} role="search">
      <div
        className="flex items-center h-9 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition px-3 gap-2"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products..."
          className={`bg-transparent placeholder-white/70 text-white text-sm focus:outline-none ${compact ? 'w-28 sm:w-40 md:w-48' : 'w-40 sm:w-56 md:w-64'}`}
          aria-label="Search products"
        />
      </div>
    </form>
  );
}
