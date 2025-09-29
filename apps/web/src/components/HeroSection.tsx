"use client";

import EnhancedGlass from "./ui/EnhancedGlass";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";
import { Package, Target, Users, Bell, PieChart } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface HeroSectionProps {
  categories: Category[];
}

export default function HeroSection({ categories }: HeroSectionProps) {
  return (
    <div className="relative mb-20 w-full px-4 sm:px-6 lg:px-8">

      {/* Bento Grid Layout - Using flex for more precise control */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-8">
        {/* Left Column - Tall Card */}
        <div className="md:w-1/3">
          <div className="relative w-full h-full overflow-hidden rounded-[24px]">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/pexels-minan1398-713661.jpg" 
                alt="Decorative lanterns" 
                className="w-full h-full object-cover"
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            
            {/* Liquid glass effect on top of the image */}
            <HeroLiquidGlass className="w-full h-full z-10 relative" padding="0" cornerRadius={24}>
              <div className="p-5 md:p-6 lg:p-8 flex flex-col h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[520px]">
                <div className="flex-1 flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <Package className="h-10 w-10 md:h-12 md:w-12 text-white mb-3 md:mb-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-100 mb-2">Trending Products</h2>
                  <p className="text-zinc-300 mb-4 md:mb-6 text-sm sm:text-base">
                    We curate collections based on real insights, not guesswork—so every product recommendation has purpose.
                  </p>
                </div>
                <div>
                  <div className="transform transition-transform duration-200 hover:scale-105 active:scale-95">
                    <EnhancedGlass 
                      className="inline-block" 
                      padding="20px 32px" 
                      cornerRadius={999}
                      intensity={6}
                      variant="subtle"
                      hoverEffect={true}
                      style={{
                        minHeight: '60px',
                        minWidth: '200px',
                      }}
                    >
                      <a href="/products" className="text-white/90 font-medium text-base md:text-lg flex items-center justify-center whitespace-nowrap">
                        <span>Browse products</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </EnhancedGlass>
                  </div>
                </div>
              </div>
            </HeroLiquidGlass>
          </div>
        </div>

        {/* Right Column - Stacked Cards */}
        <div className="md:w-2/3 flex flex-col space-y-2">
          {/* Top Row - Full Width */}
          <div>
            <HeroLiquidGlass className="w-full" padding="0" cornerRadius={24}>
              <div className="p-5 md:p-6 lg:p-8 flex items-center h-[140px] sm:h-[150px] md:h-[160px] lg:h-[180px]">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-zinc-100 mb-1 md:mb-2">Targeted Collections</h2>
                  <p className="text-zinc-300 text-sm sm:text-base">
                    Reach the right products at the right time with personalized recommendations across every category.
                  </p>
                </div>
                <div className="ml-3 md:ml-4 flex-shrink-0">
                  <Target className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-white" />
                </div>
              </div>
            </HeroLiquidGlass>
          </div>

          {/* Middle Row - Two Cards Side by Side with minimal gap */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="sm:w-1/2">
              <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
                <div className="p-5 md:p-6 lg:p-8 h-[140px] sm:h-[150px] md:h-[160px] lg:h-[160px]">
                  <div className="mb-3 md:mb-4">
                    <Users className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-100 mb-1">Social Shopping</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    From content sharing to engagement features.
                  </p>
                </div>
              </HeroLiquidGlass>
            </div>
            <div className="sm:w-1/2">
              <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
                <div className="p-5 md:p-6 lg:p-8 h-[140px] sm:h-[150px] md:h-[160px] lg:h-[160px]">
                  <div className="mb-3 md:mb-4">
                    <Bell className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-100 mb-1">Exclusive Deals</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    Boost visibility with content that resonates and delivers value.
                  </p>
                </div>
              </HeroLiquidGlass>
            </div>
          </div>

          {/* Bottom Row - Two Cards Side by Side */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="sm:w-2/3">
              <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
                <div className="p-5 md:p-6 lg:p-8 flex items-center h-[140px] sm:h-[150px] md:h-[160px] lg:h-[160px]">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-zinc-100 mb-1">Become a Seller</h2>
                    <p className="text-zinc-300 mb-2 text-xs sm:text-sm">
                      Stand out with bold products and sharp messaging.
                    </p>
                    <div className="transform transition-transform duration-200 hover:scale-105 active:scale-95">
                      <EnhancedGlass 
                        className="inline-block" 
                        padding="12px 20px" 
                        cornerRadius={999}
                        intensity={6}
                        variant="subtle"
                        hoverEffect={true}
                        style={{
                          minHeight: '40px',
                          minWidth: '120px',
                        }}
                      >
                        <a href="/dashboard/shop" className="text-white/90 font-medium text-xs sm:text-sm flex items-center justify-center whitespace-nowrap">
                          <span>Get Started</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                          </svg>
                        </a>
                      </EnhancedGlass>
                    </div>
                  </div>
                  <div className="ml-3 md:ml-4 flex-shrink-0">
                    <Bell className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-white" />
                  </div>
                </div>
              </HeroLiquidGlass>
            </div>
            <div className="sm:w-1/3">
              <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
                <div className="p-5 md:p-6 lg:p-8 h-[140px] sm:h-[150px] md:h-[160px] lg:h-[160px]">
                  <div className="mb-3 md:mb-4">
                    <PieChart className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-100 mb-1">Sales Analytics</h3>
                  <p className="text-zinc-300 text-xs">
                    Track results in real-time and adapt fast.
                  </p>
                </div>
              </HeroLiquidGlass>
            </div>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-10 flex flex-wrap gap-2.5 justify-center">
        {categories.slice(0, 8).map((category) => (
          <HeroLiquidGlass key={category.id} padding="8px 14px" cornerRadius={999} className="text-sm">
            <a
              href={`/categories/${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}
              className="text-white/90 hover:text-white"
            >
              {category.name}
            </a>
          </HeroLiquidGlass>
        ))}
      </div>
    </div>
  );
}
