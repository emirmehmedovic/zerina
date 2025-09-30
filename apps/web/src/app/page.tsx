import { API_URL } from "@/lib/api";
import FeaturedCategories from "@/components/FeaturedCategories";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import TestimonialsSection from "@/components/TestimonialsSection";
import FeaturedShopsSection from "@/components/FeaturedShopsSection";
import NewsletterSection from "@/components/NewsletterSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import TrendingProductsSection from "@/components/TrendingProductsSection";
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string; slug: string };
type Shop = { id: string; name: string; slug: string; description?: string | null };

export default async function Home() {
  let items: Product[] = [];
  let trendingItems: Product[] = [];
  let categories: Category[] = [];
  let shops: Shop[] = [];
  
  try {
    const [resProducts, resTrending, resCats, resShops] = await Promise.all([
      fetch(`${API_URL}/api/v1/products?take=8`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/products?take=4&skip=8`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/shops/public?take=4`, { cache: 'no-store' }),
    ]);
    if (resProducts.ok) {
      const data = (await resProducts.json()) as { items: Product[] };
      items = data.items;
    }
    if (resTrending.ok) {
      const data = (await resTrending.json()) as { items: Product[] };
      trendingItems = data.items;
    }
    if (resCats.ok) {
      const data = (await resCats.json()) as { items: Category[] };
      categories = data.items.slice(0, 6);
    }
    if (resShops.ok) {
      const data = (await resShops.json()) as { items: Shop[] };
      shops = data.items;
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <HeroSection categories={categories} />
      <FeaturedCategories categories={categories} />
      
      {/* Featured Products Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Featured Products
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Handpicked items just for you
              </p>
            </div>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 backdrop-blur-sm border border-white/20 transition-all duration-300 text-zinc-900 dark:text-zinc-100 font-medium group hover:scale-105"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Trending Products */}
      <TrendingProductsSection products={trendingItems} />

      {/* Featured Shops */}
      <FeaturedShopsSection shops={shops} />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Newsletter */}
      <NewsletterSection />
    </main>
  );
}
