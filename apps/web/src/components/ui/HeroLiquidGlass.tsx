"use client";

import { CSSProperties, ReactNode } from "react";

interface HeroLiquidGlassProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  cornerRadius?: number;
  padding?: string;
}

export default function HeroLiquidGlass({
  children,
  className = "",
  style = {},
  cornerRadius = 24,
  padding = "0",
}: HeroLiquidGlassProps) {
  return (
    <div
      className={`relative ${className}`}
      style={style}
    >
      <div
        className="glass"
        style={{
          borderRadius: `${cornerRadius}px`,
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: "100%",
          padding,
          overflow: "hidden",
          transition: "all 0.2s ease-in-out",
          boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* backdrop layer with glass effect */}
        <span
          className="glass__warp"
          style={{
            position: "absolute",
            inset: "0",
            borderRadius: `${cornerRadius}px`,
            backdropFilter: `blur(8px) saturate(220%)`,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 0, 0, 0.15) 100%)",
          }}
        />

        {/* Borders removed */}

        {/* user content stays sharp */}
        <div
          className="transition-all duration-150 ease-in-out"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          {children}
        </div>
      </div>

    </div>
  );
}
