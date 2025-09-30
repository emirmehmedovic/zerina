"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
};

interface TrendingProductsSectionProps {
  products: Product[];
}

export default function TrendingProductsSection({ products }: TrendingProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20">
              <TrendingUp className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                Trending Now
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                What's hot this week
              </p>
            </div>
          </div>
          <a 
            href="/products" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 backdrop-blur-sm border border-white/20 transition-all duration-300 text-zinc-900 dark:text-zinc-100 font-medium group hover:scale-105"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
