"use client";

import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { Tag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  originalPriceCents?: number;
  discountPercent?: number;
  isOnSale?: boolean;
  currency: string;
  images?: { storageKey: string }[];
}

interface DiscountedProductsProps {
  products: Product[];
}

export default function DiscountedProducts({ products }: DiscountedProductsProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Tag className="w-12 h-12 text-zinc-400 mb-2" />
        <p className="text-zinc-400 text-sm">No discounted products available</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto h-full pb-2 scrollbar-custom">
      {products.map((product) => {
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
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex-shrink-0 w-[220px] group"
          >
            {/* Product Image Container with Overlay */}
            <div className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                sizes="220px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Warm Artisan Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-orange-800/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Discount Badge - Playful rotation */}
              {product.discountPercent && product.discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm transform -rotate-2 group-hover:rotate-0 transition-all duration-300">
                  -{product.discountPercent}% OFF
                </div>
              )}
              
              {/* Artisan Info Overlay - Shows on Hover with warm background */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                {/* Warm paper-like background */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-50/95 via-orange-50/90 to-transparent backdrop-blur-sm" />
                
                <div className="relative">
                  <h4 className="text-amber-950 font-semibold text-sm mb-2 line-clamp-2">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-900 text-lg font-bold">
                      ${(product.priceCents / 100).toFixed(2)}
                    </span>
                    {product.originalPriceCents && (
                      <span className="text-amber-700/70 text-sm line-through">
                        ${(product.originalPriceCents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {/* Artisan decorative element */}
                  <div className="absolute -right-2 -top-1 w-12 h-12 opacity-20">
                    <svg viewBox="0 0 24 24" fill="none" className="text-amber-600">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" opacity="0.3"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Title - Always Visible */}
            <div className="px-1 mt-3">
              <h4 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-gray-900 transition-colors">
                {product.title}
              </h4>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
