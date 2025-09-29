"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import HeroLiquidGlass from "@/components/ui/HeroLiquidGlass";
import ModernFilter from "@/components/ui/ModernFilter";
import ModernRating from "@/components/ui/ModernRating";
import MobileFilterDrawer from "@/components/ui/MobileFilterDrawer";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal } from "lucide-react";

type Product = { 
  id: string; 
  title: string; 
  slug: string; 
  priceCents: number; 
  currency: string; 
  shopId: string; 
  images?: { storageKey: string }[] 
};

type Category = { 
  id: string; 
  name: string 
};

interface ProductsClientProps {
  initialItems: Product[];
  categories: Category[];
  initialCategoryId?: string;
}

export default function ProductsClient({ initialItems, categories, initialCategoryId = "" }: ProductsClientProps) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [ratings, setRatings] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Handle category change
  const handleCategoryChange = async (id: string) => {
    setCategoryId(id);
    await fetchProducts(id, minPrice, maxPrice, ratings);
  };

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  // Handle rating filter change
  const handleRatingChange = (rating: number) => {
    if (ratings.includes(rating)) {
      setRatings(ratings.filter(r => r !== rating));
    } else {
      setRatings([...ratings, rating]);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    await fetchProducts(categoryId, minPrice, maxPrice, ratings);
  };

  // Fetch products with filters
  const fetchProducts = async (catId: string, min: number, max: number, ratingFilters: number[]) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/v1/products`);
      url.searchParams.set('take', '12');
      if (catId) url.searchParams.set('categoryId', catId);
      if (min > 0) url.searchParams.set('minPrice', min.toString());
      if (max < 1000) url.searchParams.set('maxPrice', max.toString());
      
      // Note: Backend would need to support these parameters
      // This is just for demonstration
      if (ratingFilters.length > 0) {
        url.searchParams.set('minRating', Math.min(...ratingFilters).toString());
      }
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { items: Product[] };
        setItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile filter button */}
      <div className="flex justify-between items-center mb-4 lg:hidden">
        <div className="flex gap-2 flex-wrap">
          <motion.button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${!categoryId ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/10 text-white border border-white/20'}`}
            onClick={() => handleCategoryChange("")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            All
          </motion.button>
          
          {/* Show only a few categories on mobile */}
          {categories.slice(0, 2).map((c) => (
            <motion.button
              key={c.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${categoryId===c.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/10 text-white border border-white/20'}`}
              onClick={() => handleCategoryChange(c.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {c.name}
            </motion.button>
          ))}
          
          {/* Show more filters button */}
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            onClick={() => setMobileFilterOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </motion.button>
        </div>
      </div>
      
      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories.map(c => ({ id: c.id, label: c.name }))}
        selectedCategory={categoryId}
        onCategoryChange={handleCategoryChange}
        priceRange={{
          min: minPrice,
          max: maxPrice,
          absoluteMin: 0,
          absoluteMax: 1000
        }}
        onPriceRangeChange={handlePriceChange}
        ratings={ratings}
        onRatingChange={handleRatingChange}
        onApplyFilters={applyFilters}
        isLoading={loading}
      />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with advanced filters */}
        <aside className="hidden lg:block w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-6">
            <ModernFilter 
              title="Filters"
              categories={categories.map(c => ({ id: c.id, label: c.name }))}
              selectedCategory={categoryId}
              onCategoryChange={handleCategoryChange}
              priceRange={{
                min: minPrice,
                max: maxPrice,
                absoluteMin: 0,
                absoluteMax: 1000
              }}
              onPriceRangeChange={handlePriceChange}
              ratings={ratings}
              onRatingChange={handleRatingChange}
              onApplyFilters={applyFilters}
              isLoading={loading}
            />
          </div>
        </aside>
        
        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80">
                  <HeroLiquidGlass className="w-full h-full" padding="0" cornerRadius={24}>
                    <div className="p-5 flex flex-col h-full">
                      <div className="h-48 rounded-lg bg-black/10 dark:bg-white/10 animate-pulse mb-4" />
                      <div className="h-5 w-36 mb-3 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      <div className="mt-auto pt-4">
                        <div className="h-10 w-full bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </HeroLiquidGlass>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-light-muted dark:text-dark-muted text-center p-10"
            >
              No products found matching your filters.
            </motion.p>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
