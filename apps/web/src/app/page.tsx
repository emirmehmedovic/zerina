import { API_URL } from "@/lib/api";
import FeaturedCategories from "@/components/FeaturedCategories";
import HeroSection from "@/components/HeroSection";
import HeroLiquidGlass from "@/components/ui/HeroLiquidGlass";
import EnhancedGlass from "@/components/ui/EnhancedGlass";

type Product = { id: string; title: string; slug: string; priceCents: number; currency: string; images?: { storageKey: string }[] };
type Category = { id: string; name: string; slug: string };

export default async function Home() {
  let items: Product[] = [];
  let categories: Category[] = [];
  try {
    const [resProducts, resCats] = await Promise.all([
      fetch(`${API_URL}/api/v1/products?take=8`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' }),
    ]);
    if (resProducts.ok) {
      const data = (await resProducts.json()) as { items: Product[] };
      items = data.items;
    }
    if (resCats.ok) {
      const data = (await resCats.json()) as { items: Category[] };
      categories = data.items.slice(0, 6);
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <HeroSection categories={categories} />
      <FeaturedCategories categories={categories} />
    </main>
  );
}
