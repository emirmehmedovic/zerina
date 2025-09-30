"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import StaticImage from "@/components/StaticImage";
import VariantSelector from "@/components/VariantSelector";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  images?: { storageKey: string; altText?: string }[];
  categories?: { category: { id: string; name: string } }[];
  variants?: { id: string; attributes: Record<string, string | number>; priceCents: number; stock: number; sku?: string }[];
};

export default function ProductDetailPage() {
  const { identifier } = useParams() as { identifier: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try direct lookup first (works for both ID and slug)
        let res = await fetch(`${API_URL}/api/v1/products/${identifier}`, { cache: 'no-store' });
        
        if (!res.ok) {
          // If that fails, try ID-specific endpoint as fallback
          res = await fetch(`${API_URL}/api/v1/products/id/${identifier}`, { cache: 'no-store' });
        }
        
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        setError("Failed to load product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [identifier]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base card-glass p-4">
              <div className="h-60 w-full rounded-md bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
                <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
              </div>
            </div>
            <div className="card-base card-glass p-4">
              <div className="h-7 w-2/3 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-3" />
              <div className="h-4 w-full rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-2" />
              <div className="h-4 w-5/6 rounded bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-6" />
              <div className="h-8 w-40 rounded-full bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse mb-6" />
              <div className="h-10 w-48 rounded-full bg-light-muted/10 dark:bg-dark-muted/10 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main>
        <h1 className="text-3xl font-bold mb-6">Product</h1>
        <p className="text-light-muted dark:text-dark-muted">{error || "Product not found."}</p>
      </main>
    );
  }

  const imgs = product.images ?? [];
  const mainImageStorageKey = imgs[0]?.storageKey || null;
  const variantMin = Array.isArray(product.variants) && product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;
  const displayPriceCents = variantMin !== null ? Math.min(product.priceCents, variantMin) : product.priceCents;

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-glass card-base">
            <StaticImage 
              fileName={mainImageStorageKey || ''} 
              alt={product.title} 
              className="h-60 w-full object-cover rounded-md mb-4" 
            />
            <div className="flex gap-2">
              {imgs.length > 0 ? (
                imgs.slice(0, 4).map((im, i) => (
                  <StaticImage 
                    key={i} 
                    fileName={im.storageKey} 
                    alt={im.altText || product.title} 
                    className="w-16 h-16 rounded object-cover" 
                    fallbackClassName="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10"
                  />
                ))
              ) : (
                <>
                  <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                  <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                  <div className="w-16 h-16 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                </>
              )}
            </div>
          </div>
          <div className="card-base card-glass">
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-light-muted dark:text-dark-muted mb-4">{product.description?.slice(0, 160) ?? ''}</p>
          <div className="text-2xl font-semibold mb-4">
            {variantMin !== null && displayPriceCents < product.priceCents ? (
              <>From {(displayPriceCents / 100).toFixed(2)} {product.currency}</>
            ) : (
              <>{(product.priceCents / 100).toFixed(2)} {product.currency}</>
            )}
          </div>
          {product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              currency={product.currency}
              productId={product.id}
              slug={product.slug}
              title={product.title}
              image={mainImageStorageKey ? `/uploads/${mainImageStorageKey.split('/').pop()}` : null}
              basePriceCents={product.priceCents}
            />
          )}
          {product.categories && product.categories.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-light-muted dark:text-dark-muted mb-1">Categories</div>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((pc) => (
                  <span key={pc.category.id} className="text-xs px-2 py-1 rounded-full bg-white/40 dark:bg-zinc-800/40 border border-light-glass-border">
                    {pc.category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Available variants</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Attributes</th>
                      <th className="py-1">Price</th>
                      <th className="py-1">Stock</th>
                      <th className="py-1">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-t border-light-glass-border">
                        <td className="py-1 pr-2 max-w-[280px]"><code className="text-xs break-words">{JSON.stringify(v.attributes)}</code></td>
                        <td className="py-1 pr-2">{(v.priceCents/100).toFixed(2)} {product.currency}</td>
                        <td className="py-1 pr-2">{v.stock}</td>
                        <td className="py-1 pr-2">{v.sku || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(!product.variants || product.variants.length === 0) && (
            <AddToCartButton 
              product={{
                productId: product.id,
                title: product.title,
                slug: product.slug,
                priceCents: product.priceCents,
                currency: product.currency,
                image: mainImageStorageKey ? `/uploads/${mainImageStorageKey.split('/').pop()}` : null
              }} 
            />
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
