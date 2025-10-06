"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import ModernRating from "./ModernRating";

interface FilterOption {
  id: string;
  label: string;
}

interface PriceRange {
  min: number;
  max: number;
  absoluteMin: number;
  absoluteMax: number;
}

interface ModernFilterProps {
  title: string;
  categories: FilterOption[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  priceRange: PriceRange;
  onPriceRangeChange: (min: number, max: number) => void;
  ratings: number[];
  onRatingChange: (rating: number) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

export default function ModernFilter({
  title,
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  ratings,
  onRatingChange,
  onApplyFilters,
  isLoading = false,
}: ModernFilterProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'price' | 'rating'>('categories');

  return (
    <motion.div 
      className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative gradient */}
      <div className="hidden" />
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 relative">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-6 bg-gray-300 rounded-full" />
          {title}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['categories', 'price', 'rating'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"
                layoutId="activeTab"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Categories */}
        <div className={activeTab === 'categories' ? 'block' : 'hidden'}>
          <div className="space-y-2">
            <motion.button
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                selectedCategory === '' 
                  ? 'bg-rose-100/60 text-amber-900 border-rose-200/70' 
                  : 'bg-white text-gray-800 hover:bg-white border-gray-200'
              }`}
              onClick={() => onCategoryChange('')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              All Categories
            </motion.button>
            
            {categories.map((category) => (
              <motion.button
                key={category.id}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                  selectedCategory === category.id 
                    ? 'bg-rose-100/60 text-amber-900 border-rose-200/70' 
                    : 'bg-white text-gray-800 hover:bg-white border-gray-200'
                }`}
                onClick={() => onCategoryChange(category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className={activeTab === 'price' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            {/* Min Price */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Min Price</span>
                <span className="text-gray-900 font-medium">${priceRange.min}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gray-400 rounded-full"
                  style={{ 
                    width: `${((priceRange.min - priceRange.absoluteMin) / (priceRange.absoluteMax - priceRange.absoluteMin)) * 100}%` 
                  }}
                />
                <input
                  type="range"
                  min={priceRange.absoluteMin}
                  max={priceRange.absoluteMax}
                  value={priceRange.min}
                  onChange={(e) => onPriceRangeChange(parseInt(e.target.value), priceRange.max)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            {/* Max Price */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Max Price</span>
                <span className="text-gray-900 font-medium">${priceRange.max}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gray-400 rounded-full"
                  style={{ 
                    width: `${((priceRange.max - priceRange.absoluteMin) / (priceRange.absoluteMax - priceRange.absoluteMin)) * 100}%` 
                  }}
                />
                <input
                  type="range"
                  min={priceRange.absoluteMin}
                  max={priceRange.absoluteMax}
                  value={priceRange.max}
                  onChange={(e) => onPriceRangeChange(priceRange.min, parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>${priceRange.absoluteMin}</span>
              <span>${priceRange.absoluteMax}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className={activeTab === 'rating' ? 'block' : 'hidden'}>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <motion.button
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors border ${
                    ratings.includes(rating) 
                      ? 'bg-amber-100/70 text-amber-900 border-amber-200/70' 
                      : 'bg-white text-gray-800 hover:bg-white border-gray-200'
                  }`}
                  onClick={() => onRatingChange(rating)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ModernRating rating={rating} className="mr-2" />
                  <span className="text-sm">{rating}+ stars</span>
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <motion.button
          className="w-full mt-6 py-3 px-4 bg-white border border-gray-200 text-gray-900 font-medium rounded-full flex items-center justify-center shadow-sm hover:shadow"
          onClick={onApplyFilters}
          disabled={isLoading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying...
            </>
          ) : (
            'Apply Filters'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
