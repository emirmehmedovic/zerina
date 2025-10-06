"use client";

import { motion } from "framer-motion";
import { Store, ArrowRight } from "lucide-react";
import Link from 'next/link';
import Image from "next/image";
import { API_URL } from "@/lib/api";

const MotionLink = motion(Link);

type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  // Optional cover fields if provided by API
  coverImage?: { storageKey: string } | null;
  coverUrl?: string | null;
};

interface FeaturedShopsSectionProps {
  shops: Shop[];
}

export default function FeaturedShopsSection({ shops }: FeaturedShopsSectionProps) {
  if (shops.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100/60 border border-rose-200/70">
                <Store className="h-6 w-6 text-rose-700" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Featured Shops</h2>
                <p className="text-gray-600">Discover our curated vendors</p>
              </div>
            </div>
            <Link 
              href="/shops" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 hover:bg-white border border-gray-200/80 transition-all duration-300 text-gray-800 font-medium group shadow-sm hover:shadow"
            >
              View All Shops
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shops.slice(0, 4).map((shop, index) => (
              <MotionLink
                key={shop.id}
                href={`/shops/${shop.slug}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="block group"
              >
                <div className="h-full rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 p-5 text-center">
                  {/* Cover image (optional) */}
                  <div className="relative w-full h-36 sm:h-40 mb-4 overflow-hidden rounded-xl">
                    {(() => {
                      const key = shop.coverImage?.storageKey ?? "";
                      let url: string | null = null;
                      if (shop.coverUrl) {
                        url = shop.coverUrl;
                      } else if (key) {
                        if (key.startsWith("/uploads/")) url = `${API_URL}${key}`;
                        else if (key.startsWith("uploads/")) url = `${API_URL}/${key}`;
                        else url = `${API_URL}/uploads/${key}`;
                      }
                      return url ? (
                        <Image
                          src={url}
                          alt={`${shop.name} cover`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-100/60 via-white/60 to-amber-100/60" />
                      );
                    })()}
                    {/* Subtle inner ring */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/50" />
                  </div>

                  {/* Shop icon fallback and label */}
                  <div className="mb-3 inline-flex p-3 rounded-2xl bg-white/70 border border-rose-100/70 shadow-sm group-hover:shadow">
                    <Store className="h-6 w-6 text-amber-800/90" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1 text-lg">{shop.name}</h3>
                  {shop.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{shop.description}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 bg-white/70 border border-rose-100/70 rounded-full px-3 py-1 group-hover:bg-white">
                    Visit shop
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </MotionLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
