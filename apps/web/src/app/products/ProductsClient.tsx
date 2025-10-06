"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  initialTotal?: number;
  categories: Category[];
  initialCategoryId?: string;
}

export default function ProductsClient({ initialItems, initialTotal, categories, initialCategoryId = "" }: ProductsClientProps) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [ratings, setRatings] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [skip, setSkip] = useState<number>(initialItems.length);
  const [total, setTotal] = useState<number>(initialTotal ?? initialItems.length);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [density, setDensity] = useState<'comfortable'|'compact'>('comfortable');

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

  // Fetch products with filters (resets pagination)
  const fetchProducts = async (catId: string, min: number, max: number, ratingFilters: number[]) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/v1/products`);
      url.searchParams.set('take', '12');
      url.searchParams.set('skip', '0');
      if (catId) url.searchParams.set('categoryId', catId);
      if (min > 0) url.searchParams.set('minPrice', min.toString());
      if (max < 1000) url.searchParams.set('maxPrice', max.toString());
      if (sortBy && sortBy !== 'relevance') url.searchParams.set('sort', sortBy);
      
      // Note: Backend would need to support these parameters
      // This is just for demonstration
      if (ratingFilters.length > 0) {
        url.searchParams.set('minRating', Math.min(...ratingFilters).toString());
      }
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { items: Product[]; total?: number };
        setItems(data.items);
        setSkip(data.items.length);
        setTotal(data.total ?? data.items.length);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load more products (infinite scroll)
  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const url = new URL(`${API_URL}/api/v1/products`);
      url.searchParams.set('take', '12');
      url.searchParams.set('skip', skip.toString());
      if (categoryId) url.searchParams.set('categoryId', categoryId);
      if (minPrice > 0) url.searchParams.set('minPrice', minPrice.toString());
      if (maxPrice < 1000) url.searchParams.set('maxPrice', maxPrice.toString());
      if (ratings.length > 0) {
        url.searchParams.set('minRating', Math.min(...ratings).toString());
      }
      if (sortBy && sortBy !== 'relevance') url.searchParams.set('sort', sortBy);
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { items: Product[]; total?: number };
        setItems((prev) => [...prev, ...data.items]);
        setSkip((s) => s + data.items.length);
        setTotal(data.total ?? total);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const canLoad = useMemo(() => !loadingMore && !loading && items.length < total, [loadingMore, loading, items.length, total]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && canLoad) {
        loadMore();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, canLoad, skip]);

  return (
    <>
      {/* Category pills (desktop) */}
      <div className="hidden lg:flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => handleCategoryChange("")}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            categoryId === ''
              ? 'bg-rose-100/70 text-amber-900 border-rose-200/80'
              : 'bg-white/70 text-gray-800 border-gray-200/80 hover:bg-white'
          }`}
        >
          All
        </button>
        {categories.slice(0, 12).map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategoryChange(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              categoryId === c.id
                ? 'bg-rose-100/70 text-amber-900 border-rose-200/80'
                : 'bg-white/70 text-gray-800 border-gray-200/80 hover:bg-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Active filters + sort + view controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Results count */}
          <span className="text-sm text-gray-600 mr-2">{items.length} of {total} results</span>
          {/* Selected category chip */}
          {categoryId && (
            <button
              onClick={() => handleCategoryChange("")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-rose-100/70 text-amber-900 border border-rose-200/80"
            >
              Category: {categories.find(c=>c.id===categoryId)?.name || 'Selected'}
              <span aria-hidden>×</span>
            </button>
          )}
          {/* Price chip */}
          {(minPrice > 0 || maxPrice < 1000) && (
            <button
              onClick={() => { setMinPrice(0); setMaxPrice(1000); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white/70 text-gray-800 border border-gray-200/80"
            >
              Price: ${minPrice} – ${maxPrice}
              <span aria-hidden>×</span>
            </button>
          )}
          {/* Ratings chips */}
          {ratings.map(r => (
            <button
              key={r}
              onClick={() => handleRatingChange(r)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-amber-100/70 text-amber-900 border border-amber-200/80"
            >
              {r}+ stars
              <span aria-hidden>×</span>
            </button>
          ))}
          {(categoryId || ratings.length>0 || minPrice>0 || maxPrice<1000) && (
            <button
              onClick={async () => { setCategoryId(""); setRatings([]); setMinPrice(0); setMaxPrice(1000); await fetchProducts("", 0, 1000, []); }}
              className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-4"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Sort + density controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <label className="text-sm text-gray-600">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); fetchProducts(categoryId, minPrice, maxPrice, ratings); }}
            className="text-sm rounded-full bg-white/80 border border-gray-200/80 px-3 py-1.5 text-gray-800"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-3 py-1.5 rounded-full text-sm border ${density==='comfortable' ? 'bg-rose-100/70 text-amber-900 border-rose-200/80' : 'bg-white/80 text-gray-800 border-gray-200/80 hover:bg-white'}`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-3 py-1.5 rounded-full text-sm border ${density==='compact' ? 'bg-rose-100/70 text-amber-900 border-rose-200/80' : 'bg-white/80 text-gray-800 border-gray-200/80 hover:bg-white'}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>
      {/* Mobile filter button */}
      <div className="flex justify-between items-center mb-4 lg:hidden">
        <div className="flex gap-2 flex-wrap">
          <motion.button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${!categoryId ? 'bg-rose-100/70 text-amber-900 border border-rose-200/80' : 'bg-white/70 text-gray-800 border border-gray-200/80'}`}
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${categoryId===c.id ? 'bg-rose-100/70 text-amber-900 border border-rose-200/80' : 'bg-white/70 text-gray-800 border border-gray-200/80'}`}
              onClick={() => handleCategoryChange(c.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {c.name}
            </motion.button>
          ))}
          
          {/* Show more filters button */}
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/80 border border-gray-200/80 text-gray-900"
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
      
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        {/* Sidebar with advanced filters */}
        <aside className="hidden lg:block w-full lg:w-80 flex-shrink-0 self-start">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
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
              className={`grid grid-cols-1 ${density==='comfortable' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center text-sm text-light-muted dark:text-dark-muted mt-6">
            {loadingMore ? "Loading more…" : ""}
          </div>
        </div>
      </div>
    </>
  );
}
