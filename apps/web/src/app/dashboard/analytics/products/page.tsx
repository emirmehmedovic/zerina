"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import Heading from "@/components/ui/Heading";
import GlassCard from "@/components/ui/GlassCard";
import StatTile from "@/components/ui/StatTile";

type ProductAnalyticsSummary = {
  id: string;
  title: string;
  slug: string;
  priceCents: number;
  currency: string;
  stock: number;
  analytics: {
    totalQty: number;
    totalRevenueCents: number;
    avgOrderValueCents: number;
    daysWithSales: number;
    growthRate?: number;
  };
};

export default function ProductsAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductAnalyticsSummary[]>([]);
  const [sortBy, setSortBy] = useState<string>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get all products
      const productsRes = await fetch(`${API_URL}/api/v1/vendor/products?take=100`, { credentials: 'include' });
      if (!productsRes.ok) throw new Error(`Failed to load products (${productsRes.status})`);
      const productsData = await productsRes.json();
      
      // Then get analytics for each product
      const productsWithAnalytics = await Promise.all(
        productsData.items.map(async (product: { id: string }) => {
          try {
            const analyticsRes = await fetch(`${API_URL}/api/v1/vendor/analytics/product/${product.id}?days=${days}`, { credentials: 'include' });
            if (!analyticsRes.ok) return { ...product, analytics: { totalQty: 0, totalRevenueCents: 0, avgOrderValueCents: 0, daysWithSales: 0 } };
            const analyticsData = await analyticsRes.json();
            return { 
              ...product, 
              analytics: analyticsData.kpis,
              // Add growth rate calculation if we have enough data
              ...(analyticsData.seasonal && analyticsData.seasonal.length >= 2 ? {
                analytics: {
                  ...analyticsData.kpis,
                  growthRate: calculateGrowthRate(analyticsData.seasonal)
                }
              } : {})
            };
          } catch (e) {
            return { ...product, analytics: { totalQty: 0, totalRevenueCents: 0, avgOrderValueCents: 0, daysWithSales: 0 } };
          }
        })
      );
      
      setProducts(productsWithAnalytics);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Failed to load product analytics');
      }
          } finally {
      setLoading(false);
    }
  };

  // Calculate growth rate from seasonal data
  const calculateGrowthRate = (seasonal: { month: string; totalRevenueCents: number }[]) => {
    if (seasonal.length < 2) return 0;
    
    // Sort by month
    const sorted = [...seasonal].sort((a, b) => a.month.localeCompare(b.month));
    
    // Get first and last month data
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    // Calculate growth rate
    if (first.totalRevenueCents === 0) return 0;
    return ((last.totalRevenueCents - first.totalRevenueCents) / first.totalRevenueCents) * 100;
  };

  useEffect(() => { load();   }, [days]);

  // Sort and filter products
  const filteredProducts = products
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case "title":
          valA = a.title;
          valB = b.title;
          break;
        case "price":
          valA = a.priceCents;
          valB = b.priceCents;
          break;
        case "stock":
          valA = a.stock;
          valB = b.stock;
          break;
        case "sales":
          valA = a.analytics.totalQty;
          valB = b.analytics.totalQty;
          break;
        case "revenue":
        default:
          valA = a.analytics.totalRevenueCents;
          valB = b.analytics.totalRevenueCents;
          break;
      }
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  // Export to CSV
  const exportCSV = () => {
    if (!products.length) return;
    
    const header = ['id', 'title', 'price', 'currency', 'stock', 'sales_qty', 'revenue', 'avg_order_value', 'days_with_sales', 'growth_rate'];
    const rows = products.map(p => [
      p.id,
      p.title,
      (p.priceCents/100).toFixed(2),
      p.currency,
      String(p.stock),
      String(p.analytics.totalQty),
      (p.analytics.totalRevenueCents/100).toFixed(2),
      (p.analytics.avgOrderValueCents/100).toFixed(2),
      String(p.analytics.daysWithSales),
      p.analytics.growthRate !== undefined ? p.analytics.growthRate.toFixed(1) : 'N/A'
    ]);
    
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-analytics-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Get total stats
  const totalStats = products.reduce((acc, p) => {
    acc.revenue += p.analytics.totalRevenueCents;
    acc.sales += p.analytics.totalQty;
    acc.products += 1;
    acc.lowStock += p.stock < 5 ? 1 : 0;
    return acc;
  }, { revenue: 0, sales: 0, products: 0, lowStock: 0 });

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <Heading>Product Analytics</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-light-muted dark:text-dark-muted">Range</label>
          <select 
            value={days} 
            onChange={(e)=> setDays(Number(e.target.value))} 
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 text-sm min-w-[120px]"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
          <button 
            onClick={exportCSV} 
            disabled={!products.length} 
            className="px-3 py-2 rounded-md border border-light-glass-border bg-white/60 dark:bg-zinc-800/60 text-sm hover:bg-white/80 dark:hover:bg-zinc-800/80 disabled:opacity-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile 
          label="Total Revenue" 
          value={`${(totalStats.revenue/100).toFixed(2)}`} 
          variant="primary"
        />
        <StatTile 
          label="Total Sales" 
          value={totalStats.sales} 
          variant="success"
        />
        <StatTile 
          label="Products" 
          value={totalStats.products} 
          href="/dashboard/products"
        />
        <StatTile 
          label="Low Stock" 
          value={totalStats.lowStock} 
          variant={totalStats.lowStock > 0 ? "warning" : "default"}
          href="/dashboard/products?lowStock=1"
        />
      </div>

      <GlassCard className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="text-sm font-medium">Product Performance</div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-light-glass-border rounded-md px-3 py-2 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 text-sm min-w-[200px]"
          />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-light-muted dark:text-dark-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading product analytics...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-sm text-light-muted dark:text-dark-muted">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-glass-border">
                  <th className="py-2 px-3 text-left">
                    <button 
                      onClick={() => handleSort('title')} 
                      className="flex items-center gap-1 hover:text-light-ink dark:hover:text-white"
                    >
                      Product
                      {sortBy === 'title' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 text-right">
                    <button 
                      onClick={() => handleSort('price')} 
                      className="flex items-center gap-1 hover:text-light-ink dark:hover:text-white ml-auto"
                    >
                      Price
                      {sortBy === 'price' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 text-right">
                    <button 
                      onClick={() => handleSort('stock')} 
                      className="flex items-center gap-1 hover:text-light-ink dark:hover:text-white ml-auto"
                    >
                      Stock
                      {sortBy === 'stock' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 text-right">
                    <button 
                      onClick={() => handleSort('sales')} 
                      className="flex items-center gap-1 hover:text-light-ink dark:hover:text-white ml-auto"
                    >
                      Sales
                      {sortBy === 'sales' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 text-right">
                    <button 
                      onClick={() => handleSort('revenue')} 
                      className="flex items-center gap-1 hover:text-light-ink dark:hover:text-white ml-auto"
                    >
                      Revenue
                      {sortBy === 'revenue' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="py-2 px-3 text-right">Growth</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-light-glass-border hover:bg-white/30 dark:hover:bg-zinc-800/30">
                    <td className="py-2 px-3">
                      <div className="flex items-center">
                        <Link 
                          href={`/dashboard/analytics/products/${product.id}`}
                          className="hover:underline font-medium truncate max-w-[200px]"
                        >
                          {product.title}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {(product.priceCents/100).toFixed(2)} {product.currency}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={product.stock < 5 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {product.analytics.totalQty}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {(product.analytics.totalRevenueCents/100).toFixed(2)} {product.currency}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {product.analytics.growthRate !== undefined ? (
                        <span className={
                          product.analytics.growthRate > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : product.analytics.growthRate < 0 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : ''
                        }>
                          {product.analytics.growthRate > 0 ? '+' : ''}
                          {product.analytics.growthRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-light-muted dark:text-dark-muted">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/analytics/products/${product.id}`}
                          className="px-2 py-1 rounded text-xs bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-light-glass-border"
                        >
                          Details
                        </Link>
                        <Link 
                          href={`/dashboard/products/${product.id}/edit`}
                          className="px-2 py-1 rounded text-xs bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-light-glass-border"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
      
      <GlassCard variant="subtle">
        <div className="text-sm font-medium mb-2">Product Analytics Insights</div>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li>View detailed analytics for each product by clicking on &quot;Details&quot;.</li>
          <li>Products are sorted by {sortBy === 'title' ? 'name' : sortBy} ({sortDir === 'asc' ? 'ascending' : 'descending'}).</li>
          <li>Growth rate shows the percentage change in revenue over the selected time period.</li>
          <li>Export the data to CSV for further analysis in spreadsheet software.</li>
        </ul>
      </GlassCard>
    </main>
  );
}
