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
      className="bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 relative">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full" />
          {title}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['categories', 'price', 'rating'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab 
                ? 'text-white' 
                : 'text-white/60 hover:text-white/80'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"
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
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedCategory === '' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
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
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
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
                <span className="text-white/70">Min Price</span>
                <span className="text-white font-medium">${priceRange.min}</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
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
                <span className="text-white/70">Max Price</span>
                <span className="text-white font-medium">${priceRange.max}</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
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
            
            <div className="flex justify-between text-xs text-white/50">
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
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                    ratings.includes(rating) 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
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
          className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg flex items-center justify-center"
          onClick={onApplyFilters}
          disabled={isLoading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
