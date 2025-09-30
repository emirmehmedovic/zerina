"use client";

import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '@/lib/api';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

interface ShopData {
  id: string;
  name: string;
  status: string;
  revenue: number;
  orderCount: number;
  productCount: number;
}

export default function ShopsAnalytics() {
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [sortBy, setSortBy] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_URL}/api/v1/admin/analytics-v2/shops`);
        url.searchParams.set('q', q);
        url.searchParams.set('take', String(take));
        url.searchParams.set('skip', String((page - 1) * take));
        url.searchParams.set('sortBy', sortBy);
        url.searchParams.set('sortDir', sortDir);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setShops(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch shop analytics:', error);
      }
      setLoading(false);
    };
    fetchShops();
  }, [q, page, take, sortBy, sortDir]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    return sortDir === 'asc' ? <ArrowUp className="inline ml-1 h-4 w-4" /> : <ArrowDown className="inline ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search by shop name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center p-10 text-zinc-500">Loading shop data...</div>
      ) : (
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-4 text-left font-semibold text-zinc-300 cursor-pointer" onClick={() => handleSort('name')}>Shop {renderSortArrow('name')}</th>
                <th className="py-3 px-4 text-right font-semibold text-zinc-300 cursor-pointer" onClick={() => handleSort('revenue')}>Revenue {renderSortArrow('revenue')}</th>
                <th className="py-3 px-4 text-right font-semibold text-zinc-300 cursor-pointer" onClick={() => handleSort('orders')}>Orders {renderSortArrow('orders')}</th>
                <th className="py-3 px-4 text-right font-semibold text-zinc-300 cursor-pointer" onClick={() => handleSort('products')}>Products {renderSortArrow('products')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {shops.map(shop => (
                <tr key={shop.id}>
                  <td className="py-3 px-4 font-medium text-white">{shop.name}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">${(shop.revenue / 100).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-zinc-300">{shop.orderCount}</td>
                  <td className="py-3 px-4 text-right text-zinc-300">{shop.productCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex items-center justify-between text-sm">
            <div className="text-zinc-400">Showing {shops.length} of {total} shops</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg border border-white/10 bg-black/20 hover:bg-white/5 disabled:opacity-50 transition-colors">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * take >= total} className="px-3 py-1 rounded-lg border border-white/10 bg-black/20 hover:bg-white/5 disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
