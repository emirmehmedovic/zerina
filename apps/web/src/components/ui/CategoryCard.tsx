import React from 'react';
import Link from 'next/link';
import { Palette, Shirt, Home, Gem, Gamepad2, Package } from 'lucide-react';
import LiquidGlass from './LiquidGlass';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// Map category names to icons and accent colors
const getCategoryStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('art') || lowerName.includes('craft')) {
    return { 
      icon: Palette, 
      gradient: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
      iconColor: 'text-purple-200',
      glow: 'group-hover:shadow-purple-500/50'
    };
  }
  if (lowerName.includes('clothing') || lowerName.includes('fashion')) {
    return { 
      icon: Shirt, 
      gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
      iconColor: 'text-blue-200',
      glow: 'group-hover:shadow-blue-500/50'
    };
  }
  if (lowerName.includes('home') || lowerName.includes('living')) {
    return { 
      icon: Home, 
      gradient: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
      iconColor: 'text-amber-200',
      glow: 'group-hover:shadow-amber-500/50'
    };
  }
  if (lowerName.includes('jewelry') || lowerName.includes('jewel')) {
    return { 
      icon: Gem, 
      gradient: 'from-emerald-500/20 via-teal-500/20 to-emerald-500/20',
      iconColor: 'text-emerald-200',
      glow: 'group-hover:shadow-emerald-500/50'
    };
  }
  if (lowerName.includes('toy') || lowerName.includes('game')) {
    return { 
      icon: Gamepad2, 
      gradient: 'from-rose-500/20 via-pink-500/20 to-rose-500/20',
      iconColor: 'text-rose-200',
      glow: 'group-hover:shadow-rose-500/50'
    };
  }
  
  return { 
    icon: Package, 
    gradient: 'from-zinc-400/10 via-transparent to-zinc-600/10',
    iconColor: 'text-zinc-100',
    glow: 'group-hover:shadow-zinc-500/50'
  };
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const style = getCategoryStyle(category.name);
  const Icon = style.icon;
  
  return (
    <Link href={`/categories/${category.slug}`} className="block group">
      <LiquidGlass cornerRadius={24} padding="0" className={`w-full hover:shadow-2xl ${style.glow} transition-all duration-500`}>
        <div className="aspect-square w-full px-4 sm:px-5 flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:scale-[1.05] relative overflow-hidden">
          {/* Animated gradient background with category color */}
          <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Floating orb effect with category color */}
          <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${style.gradient} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
          
          {/* Sparkle effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
          </div>
          
          <div className="relative z-10 transform group-hover:-translate-y-1 group-hover:rotate-3 transition-all duration-300">
            <div className={`mb-4 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 inline-block group-hover:border-white/40 group-hover:shadow-lg group-hover:rotate-[-3deg] transition-all duration-300`}>
              <Icon className={`h-7 w-7 sm:h-9 sm:w-9 ${style.iconColor} group-hover:scale-110 transition-transform duration-300`} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] tracking-wide">
              {category.name}
            </h3>
          </div>
        </div>
      </LiquidGlass>
    </Link>
  );
};

export default CategoryCard;
