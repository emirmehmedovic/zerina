"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

interface Product {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
}

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [products.length]);

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800 text-lg">No products available</p>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800">Loading...</p>
      </div>
    );
  }

  const storageKey = currentProduct.images?.[0]?.storageKey || "";
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
    <div className="relative w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="flex-1 flex flex-col"
        >
          {/* Product Image - Full width/height background */}
          <div className="relative w-full flex-1 min-h-[400px] rounded-2xl overflow-hidden bg-white shadow-lg">
            <Image
              src={imageUrl}
              alt={currentProduct.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            {/* Overlay with product info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent p-6">
              <h3 className="text-xl font-bold text-amber-900 mb-2 line-clamp-2">
                {currentProduct.title}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-amber-900">
                  ${(currentProduct.priceCents / 100).toFixed(0)}
                </span>
                <span className="text-sm text-amber-800">{currentProduct.currency}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="flex gap-2 justify-center mt-6">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-amber-900"
                : "w-2 bg-amber-900/30 hover:bg-amber-900/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
