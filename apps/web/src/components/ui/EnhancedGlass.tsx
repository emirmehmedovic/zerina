"use client";

import { CSSProperties, ReactNode } from "react";

interface EnhancedGlassProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  cornerRadius?: number;
  padding?: string;
  intensity?: number; // Controls the glass effect intensity (1-10)
  hoverEffect?: boolean; // Whether to add hover effects
  borderHighlight?: boolean; // Whether to add border highlight
  colorTint?: string; // Optional color tint (CSS color)
  variant?: 'default' | 'subtle' | 'prominent'; // Glass style variant
}

export default function EnhancedGlass({
  children,
  className = "",
  style = {},
  cornerRadius = 24,
  padding = "0",
  intensity = 5,
  hoverEffect = true,
  borderHighlight = true,
  colorTint,
  variant = 'default',
}: EnhancedGlassProps) {
  // Calculate blur amount based on intensity and variant
  const blurAmount = variant === 'subtle' 
    ? `${Math.max(2, intensity)}px`
    : variant === 'prominent'
      ? `${Math.max(8, intensity * 3)}px`
      : `${Math.max(4, intensity * 2)}px`;
  
  const saturation = variant === 'subtle'
    ? 100 + intensity * 5
    : variant === 'prominent'
      ? 100 + intensity * 15
      : 100 + intensity * 10;
      
  const borderOpacity = variant === 'subtle'
    ? Math.min(0.2, 0.1 + intensity * 0.01)
    : variant === 'prominent'
      ? Math.min(0.5, 0.3 + intensity * 0.02)
      : Math.min(0.3, 0.15 + intensity * 0.015);
  
  // Prepare background style with optional tint
  let glassBackground;
  if (colorTint) {
    if (variant === 'subtle') {
      glassBackground = `linear-gradient(135deg, ${colorTint}10, ${colorTint}05)`;
    } else if (variant === 'prominent') {
      glassBackground = `linear-gradient(135deg, ${colorTint}30, ${colorTint}15)`;
    } else {
      glassBackground = `linear-gradient(135deg, ${colorTint}20, ${colorTint}10)`;
    }
  } else {
    if (variant === 'subtle') {
      glassBackground = 'rgba(255, 255, 255, 0.05)';
    } else if (variant === 'prominent') {
      glassBackground = 'rgba(255, 255, 255, 0.15)';
    } else {
      glassBackground = 'rgba(255, 255, 255, 0.1)';
    }
  }

  // Hover effect based on variant
  const hoverClass = hoverEffect 
    ? variant === 'subtle'
      ? 'transition-all duration-300 hover:brightness-110'
      : variant === 'prominent'
        ? 'transition-all duration-300 hover:scale-[1.03] hover:brightness-110'
        : 'transition-all duration-300 hover:scale-[1.02]'
    : '';

  // Shadow based on variant
  const shadowStyle = variant === 'subtle'
    ? '0px 4px 16px rgba(0, 0, 0, 0.06)'
    : variant === 'prominent'
      ? '0px 12px 36px rgba(0, 0, 0, 0.15)'
      : '0px 8px 24px rgba(0, 0, 0, 0.1)';

  return (
    <div
      className={`relative group ${className} ${hoverClass}`}
      style={style}
    >
      <div
        className="glass relative overflow-hidden"
        style={{
          borderRadius: `${cornerRadius}px`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding,
          transition: "all 0.3s ease-in-out",
          boxShadow: shadowStyle,
        }}
      >
        {/* Backdrop layer with enhanced glass effect */}
        <span
          className="glass__warp absolute inset-0"
          style={{
            borderRadius: `${cornerRadius}px`,
            backdropFilter: `blur(${blurAmount}) saturate(${saturation}%)`,
            background: glassBackground,
            borderTop: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
            borderLeft: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
            borderRight: `1px solid rgba(255, 255, 255, ${borderOpacity / 2})`,
            borderBottom: `1px solid rgba(255, 255, 255, ${borderOpacity / 2})`,
          }}
        />

        {/* Border highlight effect */}
        {borderHighlight && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: `${cornerRadius}px`,
              padding: "1.5px",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              background: `linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.0) 0%,
                rgba(255, 255, 255, ${borderOpacity * 1.5}) 50%,
                rgba(255, 255, 255, 0.0) 100%
              )`,
              opacity: variant === 'subtle' ? 0.4 : variant === 'prominent' ? 0.8 : 0.6,
            }}
          />
        )}

        {/* Non-hovered state filter overlay */}
        {hoverEffect && (
          <span
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
            style={{
              borderRadius: `${cornerRadius}px`,
              background: "rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(1px)",
              opacity: 0.7,
            }}
          />
        )}

        {/* Content */}
        <div
          className="relative z-10 w-full"
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
