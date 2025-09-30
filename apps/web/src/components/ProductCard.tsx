"use client";

import { useState } from "react";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";
import StaticImage from "./StaticImage";
import ProductQuickView from "./ProductQuickView";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    images?: { storageKey: string }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.03 }}
      className="h-full"
    >
      <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
        <div className="p-5 flex flex-col h-full">
          {/* Image */}
          <div className="relative mb-4 overflow-hidden rounded-lg group">
            {product.images && product.images.length > 0 ? (
              <StaticImage
                fileName={product.images[0].storageKey}
                alt={product.title}
                className="h-48 w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            ) : (
              <div className="h-48 bg-light-muted/10 dark:bg-dark-muted/10 rounded-lg"/>
            )}
            
            {/* Quick view button (appears on hover) */}
            <button
              onClick={() => setQuickViewOpen(true)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-label="Quick view"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium">
                <Eye className="w-4 h-4" />
                Quick View
              </div>
            </button>
            
            {/* Price tag */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
              {(product.priceCents / 100).toFixed(2)} {product.currency}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">{product.title}</h3>
            
            <div className="mt-auto pt-4">
              <a 
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center w-full py-2 px-4 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-white text-sm font-medium"
              >
                View Details
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </HeroLiquidGlass>
      
      {/* Quick View Modal */}
      <ProductQuickView
        productId={product.id}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </motion.div>
  );
}
