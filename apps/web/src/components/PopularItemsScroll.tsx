"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
}

interface PopularItemsScrollProps {
  products: Product[];
}

export default function PopularItemsScroll({ products }: PopularItemsScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || products.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // Reset scroll when we've scrolled through all items
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationFrame = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrame);
  }, [products.length]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400 text-sm">No popular items</p>
      </div>
    );
  }

  // Duplicate products for seamless infinite scroll
  const duplicatedProducts = [...products, ...products];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden h-full items-center"
        style={{ scrollBehavior: "auto" }}
      >
        {duplicatedProducts.map((product, index) => {
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
              key={`${product.id}-${index}`}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-[220px] group"
            >
              {/* Product Image Container with Warm Overlay */}
              <div className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <Image
                  src={imageUrl}
                  alt={product.title}
                  fill
                  sizes="220px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Soft Lavender/Rose Gradient Overlay on Hover - Girly & Artisan */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-pink-800/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Rating Badge - Top Right with girly artisan feel */}
                <div className="absolute top-3 right-3 bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-pink-200/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  <span className="text-xs text-purple-900 font-bold">4.6</span>
                </div>
                
                {/* Artisan Info Overlay - Shows on Hover with lavender/rose background */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  {/* Soft lavender/rose paper-like background */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-50/95 via-pink-50/90 to-transparent backdrop-blur-sm" />
                  
                  <div className="relative">
                    <h4 className="text-purple-950 font-semibold text-sm mb-2 line-clamp-2">
                      {product.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-900 text-lg font-bold">
                        ${(product.priceCents / 100).toFixed(2)}
                      </span>
                      
                      {/* Artisan quality stamp - girly */}
                      <div className="flex items-center gap-1 bg-pink-100/80 px-2 py-1 rounded-full border border-pink-200/50">
                        <svg className="w-3 h-3 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] text-purple-800 font-semibold">Popular</span>
                      </div>
                    </div>
                    
                    {/* Artisan decorative element - heart/flower */}
                    <div className="absolute -right-1 -top-2 w-10 h-10 opacity-15">
                      <svg viewBox="0 0 24 24" fill="none" className="text-pink-500">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.4"/>
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
    </div>
  );
}
