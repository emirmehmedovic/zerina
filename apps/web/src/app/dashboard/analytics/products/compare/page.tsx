"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";

type ProductAnalytics = {
  product: {
    id: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    stock: number;
  };
  series: Array<{
    date: string;
    qty: number;
    revenueCents: number;
  }>;
  kpis: {
    totalQty: number;
    totalRevenueCents: number;
    avgOrderValueCents: number;
    daysWithSales: number;
  };
  seasonal: Array<{
    month: string;
    avgQtyPerDay: number;
    avgRevenuePerDay: number;
    totalQty: number;
    totalRevenueCents: number;
  }>;
  projection: {
    next30Days: {
      projectedQty: number;
      projectedRevenueCents: number;
    };
    next90Days: {
      projectedQty: number;
      projectedRevenueCents: number;
    };
  };
};

export default function ProductComparisonPage() {
  const searchParams = useSearchParams();
  const productIdsParam = searchParams.get('ids') || '';
  // Use useState to store productIds to avoid re-renders
  const [productIds, setProductIds] = useState<string[]>([]);
  const days = Number(searchParams.get('days') || 30);
  
  // Update productIds only when the URL parameter changes
  useEffect(() => {
    const newProductIds = productIdsParam ? productIdsParam.split(',').filter(Boolean) : [];
    setProductIds(newProductIds);
  }, [productIdsParam]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsData, setProductsData] = useState<Record<string, ProductAnalytics>>({});
  const [allProducts, setAllProducts] = useState<Array<{id: string; title: string}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Fetch all products only once when component mounts
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/products?take=100`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
        const data = await res.json();
        setAllProducts(data.items.map((p: any) => ({ id: p.id, title: p.title })));
      } catch (e: any) {
        console.error("Failed to load product list", e);
      }
    };
    
    fetchAllProducts();
  }, []);

  // Fetch product analytics data when productIds or days change
  // Separate useEffect for loading product data to avoid infinite loops
  useEffect(() => {
    // Skip if productIds is empty (initial render)
    if (productIds.length === 0 && productIdsParam === '') {
      setLoading(false);
      return;
    }
    
    const loadProductsData = async () => {
      if (productIds.length === 0) {
        setLoading(false);
        setProductsData({});
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const results = await Promise.all(
          productIds.map(async (id) => {
            try {
              const res = await fetch(`${API_URL}/api/v1/vendor/analytics/product/${id}?days=${days}`, { credentials: 'include' });
              if (!res.ok) throw new Error(`Failed to load product ${id} (${res.status})`);
              return { id, data: await res.json() };
            } catch (e) {
              console.error(`Failed to load product ${id}`, e);
              return { id, data: null };
            }
          })
        );
        
        const dataMap: Record<string, ProductAnalytics> = {};
        results.forEach(({ id, data }) => {
          if (data && data.product) {
            dataMap[id] = data;
          }
        });
        
        setProductsData(dataMap);
      } catch (e: any) {
        setError(e?.message || 'Failed to load product analytics');
      } finally {
        setLoading(false);
      }
    };
    
    loadProductsData();
    // Only depend on the stable references
  }, [productIds, days, productIdsParam]);

  // Add a product to comparison - using a link instead of direct manipulation
  const getAddProductUrl = () => {
    if (!selectedProductId || productIds.includes(selectedProductId)) return '';
    const newIds = [...productIds, selectedProductId];
    return `/dashboard/analytics/products/compare?ids=${encodeURIComponent(newIds.join(','))}&days=${days}`;
  };

  // Remove a product from comparison - using a link instead of direct manipulation
  const getRemoveProductUrl = (id: string) => {
    const newIds = productIds.filter(pid => pid !== id);
    if (newIds.length > 0) {
      return `/dashboard/analytics/products/compare?ids=${encodeURIComponent(newIds.join(','))}&days=${days}`;
    } else {
      return `/dashboard/analytics/products/compare?days=${days}`;
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (Object.keys(productsData).length === 0) return;
    
    // Prepare headers
    const headers = ['metric', ...Object.values(productsData).map(d => d.product.title)];
    
    // Prepare rows
    const metrics = [
      { name: 'price', getValue: (d: ProductAnalytics) => (d.product.priceCents/100).toFixed(2) },
      { name: 'currency', getValue: (d: ProductAnalytics) => d.product.currency },
      { name: 'stock', getValue: (d: ProductAnalytics) => String(d.product.stock) },
      { name: 'total_sales', getValue: (d: ProductAnalytics) => String(d.kpis.totalQty) },
      { name: 'total_revenue', getValue: (d: ProductAnalytics) => (d.kpis.totalRevenueCents/100).toFixed(2) },
      { name: 'avg_order_value', getValue: (d: ProductAnalytics) => (d.kpis.avgOrderValueCents/100).toFixed(2) },
      { name: 'days_with_sales', getValue: (d: ProductAnalytics) => String(d.kpis.daysWithSales) },
      { name: 'projected_sales_30d', getValue: (d: ProductAnalytics) => String(d.projection.next30Days.projectedQty) },
      { name: 'projected_revenue_30d', getValue: (d: ProductAnalytics) => (d.projection.next30Days.projectedRevenueCents/100).toFixed(2) },
    ];
    
    const rows = metrics.map(metric => {
      return [
        metric.name,
        ...Object.values(productsData).map(d => metric.getValue(d))
      ];
    });
    
    // Generate CSV
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-comparison-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addProductUrl = getAddProductUrl();

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <Heading>Product Comparison</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            href={`/dashboard/analytics/products`}
            className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-colors"
          >
            Back to Products
          </Link>
          <button 
            onClick={exportCSV} 
            disabled={Object.keys(productsData).length === 0} 
            className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <GlassCard className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="text-sm font-medium">Add Product to Comparison</div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="border border-light-glass-border rounded-md px-3 py-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 text-sm min-w-[200px]"
            >
              <option value="">Select a product...</option>
              {allProducts
                .filter(p => !productIds.includes(p.id))
                .map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))
              }
            </select>
            {addProductUrl ? (
              <Link 
                href={addProductUrl}
                className={`px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Add to Comparison
              </Link>
            ) : (
              <button 
                disabled={true}
                className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm opacity-50"
              >
                Add to Comparison
              </button>
            )}
          </div>
        </div>
      </GlassCard>
      
      {loading ? (
        <GlassCard padded="lg" className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-light-muted dark:text-dark-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading product analytics...</span>
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard padded="lg" className="text-sm text-red-600">{error}</GlassCard>
      ) : productIds.length === 0 ? (
        <GlassCard padded="lg" className="text-center">
          <div className="text-sm text-light-muted dark:text-dark-muted mb-4">No products selected for comparison.</div>
          <div className="text-sm">
            Please select products to compare from the{" "}
            <Link href="/dashboard/analytics/products" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Products Analytics
            </Link>{" "}
            page.
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mb-6 overflow-x-auto">
            <div className="text-sm font-medium mb-4">Product Comparison</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-glass-border">
                  <th className="py-2 px-3 text-left">Metric</th>
                  {Object.values(productsData).map(data => (
                    <th key={data.product.id} className="py-2 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="font-medium truncate max-w-[150px]">{data.product.title}</div>
                        <Link 
                          href={getRemoveProductUrl(data.product.id)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:underline mt-1"
                        >
                          Remove
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Price</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {(data.product.priceCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Stock</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      <span className={data.product.stock < 5 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                        {data.product.stock}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Total Sales</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {data.kpis.totalQty}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Total Revenue</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {(data.kpis.totalRevenueCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Avg. Order Value</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {(data.kpis.avgOrderValueCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Days with Sales</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {data.kpis.daysWithSales} / {days}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Projected Sales (30d)</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {data.projection.next30Days.projectedQty}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-light-glass-border">
                  <td className="py-2 px-3 font-medium">Projected Revenue (30d)</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      {(data.projection.next30Days.projectedRevenueCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Actions</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/dashboard/analytics/products/${data.product.id}`}
                          className="px-2 py-1 rounded text-xs bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-light-glass-border"
                        >
                          Details
                        </Link>
                        <Link 
                          href={`/dashboard/products/${data.product.id}/edit`}
                          className="px-2 py-1 rounded text-xs bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-light-glass-border"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </GlassCard>
          
          <GlassCard className="mb-6">
            <div className="text-sm font-medium mb-4">Sales Comparison</div>
            <div className="h-60 relative">
              {Object.values(productsData).map((data, index) => {
                const maxValue = Math.max(1, ...data.series.map(s => s.qty));
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280'];
                const color = colors[index % colors.length];
                
                return (
                  <svg 
                    key={data.product.id} 
                    className="absolute inset-0" 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                  >
                    <path 
                      d={data.series.map((s, i) => {
                        const x = (i / (data.series.length - 1)) * 100;
                        const y = 100 - (s.qty / maxValue) * 100;
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ')}
                      stroke={color}
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {Object.values(productsData).map((data, index) => {
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={data.product.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                    <div className="text-sm truncate max-w-[150px]">{data.product.title}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </>
      )}
    </main>
  );
}
