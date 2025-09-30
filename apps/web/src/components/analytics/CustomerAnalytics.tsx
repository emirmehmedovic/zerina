"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_URL } from '@/lib/api';
import GeoHeatmap from './GeoHeatmap';

interface CustomerInsights {
  newVsReturning: { new: number; returning: number; };
  geo: { country: string; orders: number; }[];
}

export default function CustomerAnalytics() {
  const [data, setData] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/analytics/customer-insights`, { credentials: 'include' });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch customer analytics:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-zinc-400">Loading customer analytics...</div>;
  }

  const pieData = [
    { name: 'New Customers', value: data?.newVsReturning.new || 0 },
    { name: 'Returning Customers', value: data?.newVsReturning.returning || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Customer Segmentation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="lg:col-span-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
        <h3 className="text-sm uppercase tracking-wider text-zinc-400 mb-4">Geographic Sales</h3>
        <GeoHeatmap data={data?.geo || []} />
      </div>
    </div>
  );
}
