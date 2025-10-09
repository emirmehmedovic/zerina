"use client";

import Link from "next/link";
import Image from "next/image";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

import { Store } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    images?: { storageKey: string }[];
    isOnSale?: boolean;
    originalPriceCents?: number;
    shop?: { name: string };
    hasVariants?: boolean;
    minPriceCents?: number;
    maxPriceCents?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  // Get image URL
  const storageKey = product.images?.[0]?.storageKey || "";
  let imageUrl = "/placeholder-product.svg";
  
  if (storageKey) {
    if (storageKey.startsWith("/uploads/")) {
      imageUrl = `${API_URL}${storageKey}`;
    } else if (storageKey.startsWith("uploads/")) {
      imageUrl = `${API_URL}/${storageKey}`;
    } else {
      imageUrl = `${API_URL}/uploads/${storageKey}`;
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/products/${product.slug}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/products/${product.slug}`); } }}
      className="group block cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50/30 via-white/40 to-amber-50/30 backdrop-blur-lg border border-white/20 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-white/30 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative h-[280px] overflow-hidden p-2 sm:p-3">
          {/* Artisan frame */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-white/70 via-rose-50/50 to-amber-50/50 border border-white/30" />

          {/* Rounded image wrapper */}
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover will-change-transform group-hover:scale-[1.03] transition-transform duration-500 ease-in-out"
            />
            {/* Soft vignette on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Inner ring for handcrafted feel */}
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/40" />
          </div>

          {product.isOnSale && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
              Sale
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Subtle top divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-rose-100/60 to-transparent mb-3" />

          <h3 className="text-[15px] font-semibold tracking-tight text-gray-800 mb-1.5 line-clamp-2 group-hover:text-gray-900 transition-colors">
            {product.title}
          </h3>
          {product.shop?.name && (
            <div className="inline-flex items-center gap-1.5 text-amber-900/80 bg-amber-50/60 border border-amber-100/70 rounded-full px-2 py-0.5 mb-3">
                <Store className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{product.shop.name}</span>
            </div>
          )}
          <div className="mt-auto flex items-end justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xl leading-none font-bold text-gray-900 tabular-nums">
                    {product.hasVariants && product.minPriceCents != null && product.maxPriceCents != null && product.minPriceCents !== product.maxPriceCents
                      ? `From ${(product.minPriceCents / 100).toFixed(2)}`
                      : `$${(product.priceCents / 100).toFixed(2)}`}
                </span>
                <span className="text-[11px] leading-none uppercase tracking-wide text-amber-900/70 bg-white/70 border border-rose-100/70 rounded px-1.5 py-0.5 align-middle">
                  {product.currency}
                </span>
                {product.isOnSale && product.originalPriceCents && (
                  <span className="text-xs text-gray-600 line-through bg-gray-50/80 border border-gray-200/70 rounded px-1.5 py-0.5">
                    ${(product.originalPriceCents / 100).toFixed(2)}
                  </span>
                )}
            </div>
            {product.isOnSale && product.originalPriceCents && product.originalPriceCents > product.priceCents && (
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 border border-rose-200/70 rounded-full px-2 py-0.5">
                -{Math.round(((product.originalPriceCents - product.priceCents) / product.originalPriceCents) * 100)}%
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 mt-2">
            {product.hasVariants ? (
              <Link href={`/products/${product.slug}`} className="block w-full text-center rounded-lg border border-rose-200/70 bg-white/70 hover:bg-white text-amber-900 font-semibold text-sm py-2 transition-colors">
                View options
              </Link>
            ) : (
              <AddToCartButton 
                  product={{
                      productId: product.id,
                      title: product.title,
                      slug: product.slug,
                      priceCents: product.priceCents,
                      currency: product.currency,
                      image: imageUrl
                  }}
                  variant="soft"
                  className="w-full !py-2 !text-sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
