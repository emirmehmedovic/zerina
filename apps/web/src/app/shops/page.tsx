import { API_URL } from "@/lib/api";
import { Store, ArrowRight, Sparkles } from "lucide-react";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string;
};

// Shop color variations
const getShopColor = (index: number) => {
  const colors = [
    { gradient: 'from-violet-200/20 to-purple-200/20', iconColor: 'text-violet-600 dark:text-violet-400', accentColor: 'bg-violet-400' },
    { gradient: 'from-sky-200/20 to-blue-200/20', iconColor: 'text-sky-600 dark:text-sky-400', accentColor: 'bg-sky-400' },
    { gradient: 'from-amber-200/20 to-orange-200/20', iconColor: 'text-amber-600 dark:text-amber-400', accentColor: 'bg-amber-400' },
    { gradient: 'from-emerald-200/20 to-teal-200/20', iconColor: 'text-emerald-600 dark:text-emerald-400', accentColor: 'bg-emerald-400' },
    { gradient: 'from-rose-200/20 to-pink-200/20', iconColor: 'text-rose-600 dark:text-rose-400', accentColor: 'bg-rose-400' },
    { gradient: 'from-indigo-200/20 to-purple-200/20', iconColor: 'text-indigo-600 dark:text-indigo-400', accentColor: 'bg-indigo-400' },
  ];
  return colors[index % colors.length];
};

export default async function ShopsPage() {
  let shops: Shop[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/shops/public?take=12`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items: Shop[] };
      shops = data.items || [];
    }
  } catch {}

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        {/* Enhanced header */}
        <div className="mb-12 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-400 via-zinc-300 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-zinc-900 dark:text-zinc-100 tracking-tight">
            Discover Shops
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            Explore our curated collection of vendors
          </p>
        </div>
        
        {shops.length === 0 ? (
          <div className="card-base card-glass p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">No shops to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop, index) => {
              const style = getShopColor(index);
              return (
                <article 
                  key={shop.id} 
                  className="card-base card-glass card-hover p-6 block group relative overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Animated gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Floating particles */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-zinc-400 rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                    <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-zinc-400 rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
                    <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-zinc-300 rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
                  </div>
                  
                  {/* Glow orbs */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-zinc-200/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-zinc-300/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
                  
                  <div className="relative">
                    {/* Shop icon header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <Store className={`w-6 h-6 ${style.iconColor} group-hover:scale-110 transition-transform`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors truncate">
                            {shop.name}
                          </h3>
                          <span className={`inline-block w-1.5 h-1.5 ${style.accentColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {shop.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-2">
                        {shop.description}
                      </p>
                    )}
                    
                    {/* CTA */}
                    <a 
                      href={`/shops/${shop.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Visit shop</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
