"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

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
        const res = await fetch(`${API_URL}/api/v1/vendor/products?take=100` , { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})` );
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
              const res = await fetch(`${API_URL}/api/v1/vendor/analytics/product/${id}?days=${days}` , { credentials: 'include' });
              if (!res.ok) throw new Error(`Failed to load product ${id} (${res.status})` );
              return { id, data: await res.json() };
            } catch (e) {
              console.error(`Failed to load product ${id}` , e);
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
    return `/dashboard/analytics/products/compare?ids=${encodeURIComponent(newIds.join(','))}&days=${days}` ;
  };

  // Remove a product from comparison - using a link instead of direct manipulation
  const getRemoveProductUrl = (id: string) => {
    const newIds = productIds.filter(pid => pid !== id);
    if (newIds.length > 0) {
      return `/dashboard/analytics/products/compare?ids=${encodeURIComponent(newIds.join(','))}&days=${days}` ;
    } else {
      return `/dashboard/analytics/products/compare?days=${days}` ;
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
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"` ).join(','))
      .join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-comparison-${days}days.csv` ;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addProductUrl = getAddProductUrl();

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Comparison</h1>
          <p className="text-zinc-400">Side-by-side performance analysis.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href={`/dashboard/analytics`}
            className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md text-sm text-zinc-200 hover:bg-white/5 transition-colors"
          >
            Back to Analytics
          </Link>
          <button 
            onClick={exportCSV} 
            disabled={Object.keys(productsData).length === 0} 
            className="px-4 py-2 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 mb-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Add Product to Comparison</h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="border border-white/10 rounded-lg px-3 py-2 bg-black/20 backdrop-blur-md text-zinc-200 text-sm min-w-[250px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select a product...</option>
            {allProducts
              .filter(p => !productIds.includes(p.id))
              .map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))
            }
          </select>
          <Link 
            href={addProductUrl}
            className={`px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors ${!selectedProductId || !addProductUrl ? 'opacity-50 pointer-events-none' : ''}` }
          >
            Add to Comparison
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading product analytics...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">{error}</div>
      ) : productIds.length === 0 ? (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-10 text-center">
          <p className="text-zinc-400 mb-4">No products selected for comparison.</p>
          <p className="text-sm">
            Please select products from the dropdown above to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 overflow-x-auto">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Key Metrics</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-left font-semibold text-zinc-300">Metric</th>
                  {Object.values(productsData).map(data => (
                    <th key={data.product.id} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-semibold text-white truncate max-w-[200px]">{data.product.title}</span>
                        <Link 
                          href={getRemoveProductUrl(data.product.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline"
                        >
                          Remove
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="py-3 px-4 font-medium text-zinc-400">Price</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-3 px-4 text-center text-zinc-200">
                      {(data.product.priceCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-zinc-400">Stock</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-3 px-4 text-center">
                      <span className={data.product.stock < 10 ? 'text-amber-400 font-bold' : 'text-zinc-200'}>
                        {data.product.stock}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-zinc-400">Total Sales</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-3 px-4 text-center text-zinc-200">
                      {data.kpis.totalQty}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-zinc-400">Total Revenue</td>
                  {Object.values(productsData).map(data => (
                    <td key={data.product.id} className="py-3 px-4 text-center text-emerald-400 font-semibold">
                      {(data.kpis.totalRevenueCents/100).toFixed(2)} {data.product.currency}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
            <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Sales Volume Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="date" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <Legend />
                  {Object.values(productsData).map((data, index) => {
                    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
                    const color = colors[index % colors.length];
                    const seriesData = data.series.map(s => ({ date: s.date, [data.product.title]: s.qty }));
                    return <Line key={data.product.id} type="monotone" dataKey={data.product.title} data={seriesData} stroke={color} />; 
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
