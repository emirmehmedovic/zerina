"use client";

import { motion } from "framer-motion";
import { Store, ArrowRight } from "lucide-react";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

interface FeaturedShopsSectionProps {
  shops: Shop[];
}

export default function FeaturedShopsSection({ shops }: FeaturedShopsSectionProps) {
  if (shops.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Featured Shops
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Discover our curated vendors
            </p>
          </div>
          <a 
            href="/shops" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 backdrop-blur-sm border border-white/20 transition-all duration-300 text-zinc-900 dark:text-zinc-100 font-medium group hover:scale-105"
          >
            View All Shops
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shops.slice(0, 4).map((shop, index) => (
            <motion.a
              key={shop.id}
              href={`/shops/${shop.slug}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="block group"
            >
              <HeroLiquidGlass className="h-full" padding="0" cornerRadius={24}>
                <div className="p-6 h-full flex flex-col items-center text-center transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 group-hover:border-white/40 transition-all duration-300">
                    <Store className="h-8 w-8 text-zinc-100 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-zinc-100 mb-2 text-lg">{shop.name}</h3>
                  {shop.description && (
                    <p className="text-zinc-300 text-sm line-clamp-2">{shop.description}</p>
                  )}
                </div>
              </HeroLiquidGlass>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
