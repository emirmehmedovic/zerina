"use client";

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Plus, X, ArrowRight } from 'lucide-react';

interface ProductData {
  id: string;
  title: string;
}

export default function ProductSelectorForComparison() {
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/products?take=200`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const filteredProducts = allProducts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProducts = selectedIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);

  if (loading) {
    return <div className="text-zinc-400 text-center p-10">Loading products...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left: Product List */}
      <div className="md:col-span-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">1. Select Products</h3>
        <input 
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 mb-4 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
              onClick={() => toggleSelection(p.id)}
            >
              <span className="text-zinc-200">{p.title}</span>
              <button className={`h-6 w-6 flex items-center justify-center rounded-full transition-all ${selectedIds.includes(p.id) ? 'bg-blue-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                {selectedIds.includes(p.id) ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Staging Area */}
      <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4">2. Compare</h3>
        <div className="flex-grow space-y-3 mb-4">
          {selectedProducts.length === 0 ? (
            <div className="text-center text-zinc-500 pt-10">Select products from the left to add them here.</div>
          ) : (
            selectedProducts.map(p => {
              if (!p) return null; // Type guard
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-zinc-200 truncate pr-2">{p.title}</span>
                  <button onClick={() => toggleSelection(p.id)} className="text-red-400 hover:text-red-300">
                    <X size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <a 
          href={`/dashboard/analytics/compare?ids=${selectedIds.join(',')}`}
          className={`mt-auto block w-full text-center px-4 py-3 rounded-lg border border-transparent bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 transition-all ${selectedIds.length < 2 ? 'opacity-40 pointer-events-none' : 'hover:bg-blue-500'}`}
        >
          Compare Selected ({selectedIds.length}) <ArrowRight size={18} />
        </a>
        <p className="text-xs text-zinc-500 mt-3 text-center">Select at least two products to enable comparison.</p>
      </div>
    </div>
  );
}
