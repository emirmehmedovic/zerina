"use client";

import { ReactNode } from "react";
import LiquidGlass from "./LiquidGlass";

interface BentoItemProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  hasGlass?: boolean;
  cornerRadius?: number;
}

export function BentoItem({
  children,
  className = "",
  colSpan = 1,
  rowSpan = 1,
  hasGlass = true,
  cornerRadius = 24,
}: BentoItemProps) {
  const gridClasses = `col-span-${colSpan} row-span-${rowSpan} ${className}`;

  if (!hasGlass) {
    return <div className={gridClasses}>{children}</div>;
  }

  return (
    <div className={gridClasses}>
      <LiquidGlass cornerRadius={cornerRadius} className="h-full w-full">
        <div className="p-4 h-full w-full">{children}</div>
      </LiquidGlass>
    </div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: number;
  gap?: number;
}

export function BentoGrid({
  children,
  className = "",
  cols = 4,
  gap = 4,
}: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${cols} gap-${gap} ${className}`}
    >
      {children}
    </div>
  );
}
