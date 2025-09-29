"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ModernFilter from "./ModernFilter";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; label: string }[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  priceRange: {
    min: number;
    max: number;
    absoluteMin: number;
    absoluteMax: number;
  };
  onPriceRangeChange: (min: number, max: number) => void;
  ratings: number[];
  onRatingChange: (rating: number) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  ratings,
  onRatingChange,
  onApplyFilters,
  isLoading = false,
}: MobileFilterDrawerProps) {
  // Close drawer when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent scrolling when drawer is open
      window.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.body.style.overflow = ""; // Restore scrolling
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="bg-black/30 backdrop-blur-md pt-2 pb-4 flex justify-center">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>
            
            {/* Content */}
            <div className="bg-black/30 backdrop-blur-md pb-8">
              <ModernFilter
                title="Filters"
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={onPriceRangeChange}
                ratings={ratings}
                onRatingChange={onRatingChange}
                onApplyFilters={() => {
                  onApplyFilters();
                  onClose();
                }}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
