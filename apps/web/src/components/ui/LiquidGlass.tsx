"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  cornerRadius?: number;
  padding?: string;
  tint?: 'blue' | 'rose';
}

export default function LiquidGlass({
  children,
  className = "",
  style = {},
  cornerRadius = 24,
  padding = "0",
  tint = 'blue',
}: LiquidGlassProps) {
  const background = tint === 'rose'
    ? 'linear-gradient(135deg, rgba(255, 182, 193, 0.25) 0%, rgba(255, 182, 193, 0.08) 30%, rgba(255, 255, 255, 0.02) 60%, rgba(0, 0, 0, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(0, 122, 255, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)';
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
            backdropFilter: `blur(12px) saturate(180%)`,
            background,
            borderTop: "1px solid rgba(255, 255, 255, 0.3)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        />

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
