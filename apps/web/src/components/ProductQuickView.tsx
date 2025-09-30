"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { API_URL } from "@/lib/api";
import StaticImage from "./StaticImage";
import AddToCartButton from "./AddToCartButton";
import VariantSelector from "./VariantSelector";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  images?: { storageKey: string; altText?: string }[];
  variants?: { id: string; attributes: Record<string, string | number>; priceCents: number; stock: number; sku?: string }[];
};

interface ProductQuickViewProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductQuickView({ productId, isOpen, onClose }: ProductQuickViewProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !productId) return;
    
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Try ID endpoint first
        const res = await fetch(`${API_URL}/api/v1/products/id/${productId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          setSelectedImageIndex(0);
        } else {
          console.error("Failed to fetch product:", res.status);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const imgs = product?.images ?? [];
  const mainImageStorageKey = imgs[selectedImageIndex]?.storageKey || imgs[0]?.storageKey || null;
  const variantMin = Array.isArray(product?.variants) && product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;
  const displayPriceCents = variantMin !== null && product ? Math.min(product.priceCents, variantMin) : product?.priceCents ?? 0;

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop with animated blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden pointer-events-auto"
            >
              {/* Decorative gradient orbs - subtle neutral tones */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="card-base card-glass p-8 overflow-y-auto max-h-[95vh] relative border border-white/10 shadow-2xl">
                {/* Close button with enhanced styling */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:scale-110 group"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400"></div>
                  </div>
                ) : product ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Images with enhanced styling */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="mb-4 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/5 to-zinc-200/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl bg-white/5">
                          <StaticImage
                            fileName={mainImageStorageKey || ''}
                            alt={product.title}
                            className="w-full h-[500px] object-cover"
                          />
                        </div>
                      </div>
                      {imgs.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {imgs.map((im, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedImageIndex(i)}
                              className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                i === selectedImageIndex 
                                  ? 'ring-2 ring-zinc-400 border-zinc-400 shadow-lg shadow-zinc-400/30' 
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <StaticImage
                                fileName={im.storageKey}
                                alt={im.altText || product.title}
                                className="w-20 h-20 object-cover"
                                fallbackClassName="w-20 h-20 bg-light-muted/10 dark:bg-dark-muted/10"
                              />
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    {/* Right: Details with enhanced styling */}
                    <motion.div 
                      className="flex flex-col"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="mb-4">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                          {product.title}
                        </h2>
                      </div>
                      
                      <div className="inline-flex items-baseline gap-2 mb-6">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                          {variantMin !== null && displayPriceCents < product.priceCents ? (
                            <>From {(displayPriceCents / 100).toFixed(2)}</>
                          ) : (
                            <>{(product.priceCents / 100).toFixed(2)}</>
                          )}
                        </div>
                        <span className="text-lg text-zinc-600 dark:text-zinc-400">{product.currency}</span>
                      </div>

                      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-light-muted dark:text-dark-muted leading-relaxed line-clamp-4">
                          {product.description}
                        </p>
                      </div>

                      {product.variants && product.variants.length > 0 ? (
                        <div className="mb-6">
                          <VariantSelector
                            variants={product.variants}
                            currency={product.currency}
                            productId={product.id}
                            slug={product.slug}
                            title={product.title}
                            image={mainImageStorageKey ? `/uploads/${mainImageStorageKey.split('/').pop()}` : null}
                            basePriceCents={product.priceCents}
                          />
                        </div>
                      ) : (
                        <AddToCartButton
                          product={{
                            productId: product.id,
                            title: product.title,
                            slug: product.slug,
                            priceCents: product.priceCents,
                            currency: product.currency,
                            image: mainImageStorageKey ? `/uploads/${mainImageStorageKey.split('/').pop()}` : null
                          }}
                        />
                      )}

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <a
                          href={`/products/${product.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
                        >
                          View full details 
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-light-muted dark:text-dark-muted">
                    Product not found
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
