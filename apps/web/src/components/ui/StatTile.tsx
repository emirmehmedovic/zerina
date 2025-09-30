"use client";

import React from "react";

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  href?: string;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  icon?: React.ReactElement<{ className?: string }>;
};

export default function StatTile({ 
  label, 
  value, 
  href, 
  trend, 
  trendLabel,
  variant = "default",
  icon
}: StatTileProps) {
  // Determine color scheme based on variant
  const variantClasses = {
    default: {
      gradient: "from-zinc-700 to-zinc-800",
      icon: "text-zinc-400",
    },
    primary: {
      gradient: "from-blue-500 to-purple-600",
      icon: "text-blue-300",
    },
    success: {
      gradient: "from-emerald-500 to-green-600",
      icon: "text-emerald-300",
    },
    warning: {
      gradient: "from-amber-500 to-orange-600",
      icon: "text-amber-300",
    },
    danger: {
      gradient: "from-rose-500 to-red-600",
      icon: "text-rose-300",
    }
  } as const;
  
  // Determine trend color
  let trendColor = "";
  if (trend !== undefined) {
    trendColor = trend > 0 
      ? "text-emerald-600 dark:text-emerald-400" 
      : trend < 0 
        ? "text-rose-600 dark:text-rose-400" 
        : "text-zinc-600 dark:text-zinc-400";
  }
  
  const inner = (
    <div className={`group relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-5 transition-all duration-300 hover:bg-black/30`}>
      {/* Accent border that glows on hover */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${variantClasses[variant].gradient} transition-all duration-300 group-hover:shadow-[0_0_15px] ${variantClasses[variant].icon}`} />

      <div className="relative">
        <div className="flex justify-between items-start mb-3">
          <div className="text-sm uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">{label}</div>
          {icon && (
            <div className={`transition-transform duration-300 group-hover:scale-110 ${variantClasses[variant].icon} h-6 w-6`}>
              {icon}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-white">{value}</div>
        {(trend !== undefined || trendLabel) && (
          <div className={`text-sm mt-2 flex items-center gap-1.5 ${trendColor}`}>
            {trend !== undefined && (
              <span className="flex items-center gap-1 font-semibold">
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {trendLabel && <span className="text-zinc-400 font-light">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
  
  if (href) {
    return (
      <a 
        href={href} 
        className="block focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
      >
        {inner}
      </a>
    );
  }
  
  return inner;
}
