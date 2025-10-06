import { API_URL } from "@/lib/api";
import FeaturedCategories from "@/components/FeaturedCategories";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import FeaturedShopsSection from "@/components/FeaturedShopsSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import TrendingProductsSection from "@/components/TrendingProductsSection";
import FeaturedProductsSection from '@/components/FeaturedProductsSection';
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

type Product = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  images?: { storageKey: string }[];
  isOnSale?: boolean;
  originalPriceCents?: number;
  shop?: { name: string };
};
type Category = { id: string; name: string; slug: string };
type Shop = { id: string; name: string; slug: string; description?: string | null };

export default async function Home() {
  let items: Product[] = [];
  let trendingItems: Product[] = [];
  let latestProducts: Product[] = [];
  let discountedProducts: Product[] = [];
  let popularProducts: Product[] = [];
  let categories: Category[] = [];
  let shops: Shop[] = [];
  
  try {
    const [resProducts, resTrending, resLatest, resDiscounted, resPopular, resCats, resShops] = await Promise.all([
      fetch(`${API_URL}/api/v1/products?include=shop&take=8`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/products?take=4&skip=8`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/products?latest=true&take=5`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/products?onSale=true&take=4`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/products?take=10&skip=4`, { cache: 'no-store' }),
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
    if (resLatest.ok) {
      const data = (await resLatest.json()) as { items: Product[] };
      latestProducts = data.items;
    }
    if (resDiscounted.ok) {
      const data = (await resDiscounted.json()) as { items: Product[] };
      discountedProducts = data.items;
    }
    if (resPopular.ok) {
      const data = (await resPopular.json()) as { items: Product[] };
      popularProducts = data.items;
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
      <HeroSection 
        categories={categories} 
        latestProducts={latestProducts}
        discountedProducts={discountedProducts}
        popularProducts={popularProducts}
      />
      <FeaturedCategories categories={categories} />
      
      {/* Featured Products Section */}
      <FeaturedProductsSection products={items} />

      {/* Trending Products */}
      <TrendingProductsSection products={trendingItems} />

      {/* Featured Shops */}
      <FeaturedShopsSection shops={shops} />

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA */}
      <CTASection />

      
    </main>
  );
}
