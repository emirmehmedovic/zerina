"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Link from 'next/link';

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
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100/60 border border-rose-200/70">
                <TrendingUp className="h-6 w-6 text-rose-700" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Trending Now</h2>
                <p className="text-gray-600">What&apos;s hot this week</p>
              </div>
            </div>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 hover:bg-white border border-gray-200/80 transition-all duration-300 text-gray-800 font-medium group shadow-sm hover:shadow"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
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
      </div>
    </section>
  );
}
