"use client";

import React from "react";

const VARIANTS: Record<string, string> = {
  neutral: "border-zinc-400/50 text-zinc-700 dark:text-zinc-300",
  success: "border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
  info: "border-blue-400/50 text-blue-700 dark:text-blue-300",
  note: "border-indigo-400/50 text-indigo-700 dark:text-indigo-300",
  warn: "border-amber-400/50 text-amber-700 dark:text-amber-300",
  danger: "border-rose-400/50 text-rose-700 dark:text-rose-300",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof VARIANTS;
};

export default function Badge({ className = "", variant = "neutral", ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
