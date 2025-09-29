"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ModernRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function ModernRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className = "",
}: ModernRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  // Determine star size based on prop
  const starSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];
  
  // Determine spacing between stars
  const spacing = {
    sm: "space-x-0.5",
    md: "space-x-1",
    lg: "space-x-1.5",
  }[size];

  return (
    <div className={`flex items-center ${spacing} ${className}`}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating !== null && interactive) 
          ? starValue <= hoverRating 
          : starValue <= rating;
        
        return (
          <motion.div
            key={i}
            className={`${interactive ? 'cursor-pointer' : ''}`}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
          >
            <svg 
              className={`${starSize} ${isFilled ? 'text-yellow-400' : 'text-gray-400'} transition-colors duration-200`}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
