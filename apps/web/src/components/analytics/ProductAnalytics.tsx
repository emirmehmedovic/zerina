"use client";

import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '@/lib/api';

interface ProductData {
  id: string;
  title: string;
  qty: number;
  revenueCents: number;
}

export default function ProductAnalytics() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/analytics/top-products?limit=50&days=90`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch product analytics:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  
  if (loading) {
    return <div className="text-zinc-400">Loading product analytics...</div>;
  }

  return (
    <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
      <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Product Performance Matrix</h3>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="qty" type="number" name="Units Sold" unit=" units" stroke="#a1a1aa" />
          <YAxis dataKey="revenueCents" type="number" name="Revenue" unit="$" stroke="#a1a1aa" tickFormatter={(tick) => (tick / 100).toString()} />
          <ZAxis dataKey="title" type="category" name="Product" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} formatter={(value, name) => (name === 'Revenue' ? `$${(value as number / 100).toFixed(2)}` : value)} />
          <Scatter name="Products" data={products} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
