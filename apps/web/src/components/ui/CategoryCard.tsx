import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react'; // Placeholder icon
import LiquidGlass from './LiquidGlass';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string; // Assuming categories have slugs for URLs
  };
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link href={`/categories/${category.slug}`} className="block group">
      <LiquidGlass cornerRadius={24} padding="0" className="w-full">
        <div className="aspect-square w-full px-4 sm:px-5 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:scale-[1.03]">
          <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white/80 mb-2 transition-colors group-hover:text-white" />
          <h3 className="text-sm sm:text-base font-semibold text-white">{category.name}</h3>
        </div>
      </LiquidGlass>
    </Link>
  );
};

export default CategoryCard;
