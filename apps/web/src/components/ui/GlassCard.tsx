"use client";

import React from "react";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  padded?: boolean | "sm" | "md" | "lg";
  variant?: "default" | "solid" | "subtle";
};

export default function GlassCard({ 
  as: As = "div", 
  className = "", 
  padded = true, 
  variant = "default",
  ...rest 
}: GlassCardProps) {
  // Determine background opacity based on variant
  const bgClasses = {
    default: "bg-white/70 dark:bg-zinc-900/70",
    solid: "bg-white/90 dark:bg-zinc-900/90",
    subtle: "bg-white/40 dark:bg-zinc-900/40"
  };
  
  // Determine padding based on padded prop
  let paddingClass = "";
  if (padded === true || padded === "md") {
    paddingClass = "p-4 md:p-6";
  } else if (padded === "sm") {
    paddingClass = "p-3 md:p-4";
  } else if (padded === "lg") {
    paddingClass = "p-5 md:p-8";
  }
  
  return (
    <As
      className={
        `rounded-xl border border-light-glass-border ${bgClasses[variant]} backdrop-blur-md shadow-sm ` +
        paddingClass + " " +
        className
      }
      {...rest}
    />
  );
}
