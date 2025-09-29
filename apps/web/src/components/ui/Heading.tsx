"use client";

import React from "react";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: React.ElementType;
  subtle?: boolean;
};

export default function Heading({ as: As = "h1", className = "", subtle = false, ...rest }: HeadingProps) {
  return (
    <As
      className={
        (subtle ? "text-lg font-semibold " : "text-3xl font-bold tracking-tight ") +
        "text-light-ink dark:text-white " +
        className
      }
      {...rest}
    />
  );
}
