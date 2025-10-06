"use client";

import EnhancedGlass from "./ui/EnhancedGlass";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";
import ProductCarousel from "./ProductCarousel";
import DiscountedProducts from "./DiscountedProducts";
import PopularItemsScroll from "./PopularItemsScroll";
import { Sparkles, Tag } from "lucide-react";
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

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

interface HeroSectionProps {
  categories: Category[];
  latestProducts: Product[];
  discountedProducts: Product[];
  popularProducts: Product[];
}

export default function HeroSection({ 
  categories, 
  latestProducts,
  discountedProducts,
  popularProducts 
}: HeroSectionProps) {
  return (
    <div className="relative mb-8 w-full px-4 sm:px-6 lg:px-8">
      {/* Category Pills - Moved Above Bento Grid */}
      <div className="mb-6 flex flex-wrap gap-2.5 justify-center">
        {categories.slice(0, 8).map((category) => (
          <Link
            key={category.id}
            href={`/categories/${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}
            className="px-4 py-2 rounded-full bg-rose-50/80 hover:bg-rose-100/90 text-amber-900 hover:text-amber-950 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* New Bento Grid Layout */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Left Column - Two Stacked Cards */}
        <div className="md:w-1/3 flex flex-col gap-3">
          {/* New Deals Card - Soft Lavender */}
          <div className="flex-1 bg-gradient-to-br from-violet-50/30 via-white to-purple-50/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-violet-100/30 backdrop-blur-sm">
            <div className="p-6 md:p-7 lg:p-8 flex flex-col h-full min-h-[400px]">
              <div className="mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-violet-100/50 mb-4">
                  <Sparkles className="h-8 w-8 text-violet-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">New Deals</h2>
                <p className="text-gray-600 text-base">
                  Latest products just added
                </p>
              </div>
              <div className="flex-1">
                <ProductCarousel products={latestProducts} />
              </div>
            </div>
          </div>

          {/* Become a Seller Card - Soft Peach */}
          <div className="bg-gradient-to-br from-orange-50/30 via-white to-amber-50/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-orange-100/30 backdrop-blur-sm">
            <div className="p-6 md:p-7 lg:p-8 flex items-center h-full min-h-[180px]">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Become a Seller</h2>
                <p className="text-gray-600 mb-4 text-base">
                  Stand out with bold products and sharp messaging.
                </p>
                <Link 
                  href="/dashboard/shop" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-100/80 to-amber-100/80 hover:from-orange-200/80 hover:to-amber-200/80 text-gray-800 font-medium text-base rounded-full shadow-sm hover:shadow transition-all duration-200"
                >
                  <span>Get Started</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stacked Cards */}
        <div className="md:w-2/3 flex flex-col gap-3">
          {/* Top Row - Great Value Deals - Soft Rose */}
          <div className="flex-1 bg-gradient-to-br from-rose-50/30 via-white to-pink-50/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/30 backdrop-blur-sm">
            <div className="p-5 md:p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Great Value Deals</h2>
                  <p className="text-gray-600 text-sm">Find Items On Sale With 50 - 75%</p>
                </div>
                <div className="inline-flex p-2 rounded-xl bg-rose-100/50">
                  <Tag className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <DiscountedProducts products={discountedProducts} />
            </div>
          </div>

          {/* Bottom Row - Popular Items - Soft Mint */}
          <div className="flex-1 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-teal-100/30 backdrop-blur-sm">
            <div className="p-5 md:p-6 h-full min-h-[340px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Popular Items</h2>
                <Link 
                  href="/products" 
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
                >
                  View all
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <PopularItemsScroll products={popularProducts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
