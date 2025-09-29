"use client";

import React from "react";

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  href?: string;
  trend?: number;
  trendLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
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
    default: "bg-white/70 dark:bg-zinc-900/70 border-light-glass-border",
    primary: "bg-white/70 dark:bg-zinc-900/70 border-indigo-200 dark:border-indigo-900/30",
    success: "bg-white/70 dark:bg-zinc-900/70 border-emerald-200 dark:border-emerald-900/30",
    warning: "bg-white/70 dark:bg-zinc-900/70 border-amber-200 dark:border-amber-900/30",
    danger: "bg-white/70 dark:bg-zinc-900/70 border-rose-200 dark:border-rose-900/30"
  };
  
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
    <div className={`rounded-xl border backdrop-blur-md shadow-sm p-4 transition-all hover:shadow-md ${variantClasses[variant]}`}>
      <div className="flex justify-between items-start">
        <div className="text-sm text-light-muted dark:text-dark-muted">{label}</div>
        {icon && <div className="text-light-muted dark:text-dark-muted">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-light-ink dark:text-white mt-1">{value}</div>
      {(trend !== undefined || trendLabel) && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
          {trend !== undefined && (
            <span>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {trendLabel && <span className="text-light-muted dark:text-dark-muted">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
  
  if (href) {
    return (
      <a 
        href={href} 
        className="block focus:outline-none focus:ring-2 focus:ring-indigo-400/50 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {inner}
      </a>
    );
  }
  
  return inner;
}
