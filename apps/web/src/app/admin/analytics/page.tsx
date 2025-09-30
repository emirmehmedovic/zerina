"use client";

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import StatTile from '@/components/ui/StatTile';
import GeoHeatmap from '@/components/analytics/GeoHeatmap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Store, Package, DollarSign, ShoppingCart } from 'lucide-react';
import Tabs from './Tabs';
import ShopsAnalytics from './ShopsAnalytics';

interface Kpis {
  totalRevenueCents: number;
  totalOrders: number;
  activeShops: number;
  totalProducts: number;
}

interface SalesOverTime {
  date: string;
  totalCents: number;
}

interface TopPerformer {
  productId?: string;
  shopId?: string;
  _sum: { priceCents?: number; totalCents?: number };
  _count: { quantity: number };
}

interface GeoSale {
  country: string;
  orders: number;
}

const Overview = () => {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [sales, setSales] = useState<SalesOverTime[]>([]);
  const [topPerformers, setTopPerformers] = useState<{ topProducts: TopPerformer[], topShops: TopPerformer[] } | null>(null);
  const [geoSales, setGeoSales] = useState<GeoSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisRes, salesRes, topPerformersRes, geoSalesRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/admin/analytics/kpis`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/admin/analytics/sales-over-time`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/admin/analytics/top-performers`, { credentials: 'include' }),
          fetch(`${API_URL}/api/v1/admin/analytics/geo-sales`, { credentials: 'include' }),
        ]);

        if (kpisRes.ok) setKpis(await kpisRes.json());
        if (salesRes.ok) setSales(await salesRes.json());
        if (topPerformersRes.ok) setTopPerformers(await topPerformersRes.json());
        if (geoSalesRes.ok) setGeoSales(await geoSalesRes.json());

      } catch (error) {
        console.error("Failed to fetch admin analytics:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-10 text-zinc-500">Loading marketplace analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile label="Total Revenue" value={`$${((kpis?.totalRevenueCents || 0) / 100).toLocaleString()}`} icon={<DollarSign />} />
        <StatTile label="Total Orders" value={(kpis?.totalOrders || 0).toLocaleString()} icon={<ShoppingCart />} />
        <StatTile label="Active Shops" value={(kpis?.activeShops || 0).toLocaleString()} icon={<Store />} />
        <StatTile label="Total Products" value={(kpis?.totalProducts || 0).toLocaleString()} icon={<Package />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" tickFormatter={(tick) => `$${(tick / 100).toLocaleString()}`} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} formatter={(value: number) => `$${(value / 100).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="totalCents" name="Revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Shops by Revenue</h3>
          <ul className="space-y-3">
            {topPerformers?.topShops.filter(s => s.shopId).map((shop, i) => (
              <li key={shop.shopId} className="flex items-center justify-between">
                <span className="text-zinc-300">{i + 1}. Shop #{shop.shopId?.slice(0, 8)}...</span>
                <span className="font-semibold text-emerald-400">${((shop._sum.totalCents || 0) / 100).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Sales Distribution</h3>
          <GeoHeatmap data={geoSales} />
        </div>
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Products by Revenue</h3>
          <ul className="space-y-3">
            {topPerformers?.topProducts.map((prod, i) => (
              <li key={prod.productId} className="flex items-center justify-between">
                <span className="text-zinc-300">{i + 1}. Product #{prod.productId?.slice(0, 8)}...</span>
                <span className="font-semibold text-emerald-400">${((prod._sum.priceCents || 0) / 100).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const tabs = [
    { id: 'overview', label: 'Overview', content: <Overview /> },
    { id: 'shops', label: 'Shops', content: <ShopsAnalytics /> },
  ];

  return <Tabs tabs={tabs} />;
}
