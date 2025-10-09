import React from 'react';
import Link from 'next/link';
import { Palette, Shirt, Home, Gem, Gamepad2, Package, Sparkles } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug?: string;
};

interface FeaturedCategoriesProps {
  categories: Category[];
}

// Elegant subtle styling for each category
const getCategoryStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('art') || lowerName.includes('craft')) {
    return { 
      icon: Palette,
      iconBg: 'bg-gradient-to-br from-rose-100/80 to-pink-100/80',
      iconColor: 'text-rose-600'
    };
  }
  if (lowerName.includes('clothing') || lowerName.includes('fashion')) {
    return { 
      icon: Shirt,
      iconBg: 'bg-gradient-to-br from-purple-100/80 to-pink-100/80',
      iconColor: 'text-purple-600'
    };
  }
  if (lowerName.includes('home') || lowerName.includes('living')) {
    return { 
      icon: Home,
      iconBg: 'bg-gradient-to-br from-amber-100/80 to-peach-100/80',
      iconColor: 'text-amber-600'
    };
  }
  if (lowerName.includes('jewelry') || lowerName.includes('jewel')) {
    return { 
      icon: Gem,
      iconBg: 'bg-gradient-to-br from-violet-100/80 to-purple-100/80',
      iconColor: 'text-violet-600'
    };
  }
  if (lowerName.includes('toy') || lowerName.includes('game')) {
    return { 
      icon: Gamepad2,
      iconBg: 'bg-gradient-to-br from-pink-100/80 to-rose-100/80',
      iconColor: 'text-pink-600'
    };
  }
  
  return { 
    icon: Package,
    iconBg: 'bg-gradient-to-br from-gray-100/80 to-slate-100/80',
    iconColor: 'text-gray-600'
  };
};

const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with artisan touch */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-sm">
            Explore our curated collections
          </p>
        </div>
        
        {/* Horizontal scroll with artisan cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-custom">
          {categories.map((category) => {
            const style = getCategoryStyle(category.name);
            const Icon = style.icon;
            return (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="flex-shrink-0 group"
              >
                {/* Clean elegant card */}
                <div className="relative w-[180px] h-[80px] bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
                    {/* Content */}
                    <div className="relative h-full p-3 flex items-center gap-2.5">
                      {/* Icon container */}
                      <div className={`flex-shrink-0 w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300`}>
                        <Icon className={`w-6 h-6 ${style.iconColor}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors line-clamp-2 leading-tight">
                          {category.name}
                        </h3>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
