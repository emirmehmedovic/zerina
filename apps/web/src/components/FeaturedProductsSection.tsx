"use client";

import ProductCard from "@/components/ProductCard";
import { ArrowRight, Gift } from "lucide-react";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Product = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
};

interface FeaturedProductsSectionProps {
  products: Product[];
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(Array(products.length).fill(false));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute('data-index');
          if (!indexAttr) return;
          const idx = parseInt(indexAttr, 10);
          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [products.length]);

  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <div className="inline-flex p-3 rounded-2xl bg-rose-100/50">
                    <Gift className="h-7 w-7 text-rose-600" />
                </div>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Featured Products
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                    Handpicked items just for you
                    </p>
                </div>
            </div>
            <Link 
              href="/products" 
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 hover:bg-white border border-gray-200/80 transition-all duration-300 text-gray-800 font-medium group shadow-sm hover:shadow"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product, idx) => (
              <div
                key={product.id}
                ref={(el) => { itemRefs.current[idx] = el; }}
                data-index={idx}
                style={{ transitionDelay: `${idx * 70}ms` }}
                className={
                  `transform transition-all duration-500 ease-out ` +
                  (visible[idx]
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4')
                }
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link 
                href="/products" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 hover:bg-white border border-gray-200/80 transition-all duration-300 text-gray-800 font-medium group shadow-sm hover:shadow"
            >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
