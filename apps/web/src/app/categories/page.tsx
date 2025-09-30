import { API_URL } from "@/lib/api";
import { Palette, Shirt, Home, Gem, Gamepad2, Package, ArrowRight } from "lucide-react";

type Category = { id: string; name: string; parentId?: string | null; slug?: string };

// Icon and color mapping
const getCategoryStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('art') || lowerName.includes('craft')) {
    return { 
      icon: Palette, 
      gradient: 'from-violet-200/20 to-purple-200/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      accentColor: 'bg-violet-400'
    };
  }
  if (lowerName.includes('clothing') || lowerName.includes('fashion')) {
    return { 
      icon: Shirt, 
      gradient: 'from-sky-200/20 to-blue-200/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      accentColor: 'bg-sky-400'
    };
  }
  if (lowerName.includes('home') || lowerName.includes('living')) {
    return { 
      icon: Home, 
      gradient: 'from-amber-200/20 to-orange-200/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentColor: 'bg-amber-400'
    };
  }
  if (lowerName.includes('jewelry') || lowerName.includes('jewel')) {
    return { 
      icon: Gem, 
      gradient: 'from-emerald-200/20 to-teal-200/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentColor: 'bg-emerald-400'
    };
  }
  if (lowerName.includes('toy') || lowerName.includes('game')) {
    return { 
      icon: Gamepad2, 
      gradient: 'from-rose-200/20 to-pink-200/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      accentColor: 'bg-rose-400'
    };
  }
  return { 
    icon: Package, 
    gradient: 'from-zinc-200/20 to-slate-200/20',
    iconColor: 'text-zinc-600 dark:text-zinc-400',
    accentColor: 'bg-zinc-400'
  };
};

export default async function CategoriesPage() {
  let items: Category[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/categories`, { cache: 'no-store' });
    if (res.ok) {
      const raw = await res.json();
      const base = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      items = base.map((c: any) => ({ id: c.id, name: c.name, parentId: c.parentId ?? null, slug: c.slug || c.name?.toLowerCase?.().replace(/[^a-z0-9]+/g,'-') }));
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Enhanced header with creative styling */}
        <div className="mb-12 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-400 via-zinc-300 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-zinc-900 dark:text-zinc-100 tracking-tight">
            Browse Categories
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            Find exactly what you're looking for
          </p>
        </div>
        
        {items.length === 0 ? (
          <div className="card-base card-glass p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No categories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((cat, index) => {
              const style = getCategoryStyle(cat.name);
              const Icon = style.icon;
              return (
                <a 
                  key={cat.id} 
                  href={`/categories/${encodeURIComponent(cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}`} 
                  className="card-base card-glass card-hover p-6 block group relative overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Animated gradient background with category color */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Floating particles on hover - more dynamic */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-zinc-400 rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                    <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-zinc-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
                    <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-zinc-300 rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
                  </div>
                  
                  {/* Multiple glow orbs for depth */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-zinc-200/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-zinc-300/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
                  
                  <div className="relative flex items-start gap-4">
                    {/* Icon container with category color */}
                    <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                      <Icon className={`w-6 h-6 ${style.iconColor} group-hover:scale-110 transition-transform`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                          {cat.name}
                        </h3>
                        <span className={`inline-block w-1.5 h-1.5 ${style.accentColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                        Explore {cat.name}
                      </p>
                      
                      {/* Enhanced arrow indicator with badge */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors font-medium">
                          <span>View collection</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="ml-auto px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Browse
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
