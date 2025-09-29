import React from "react";

// Fixed, full-viewport background image layer (server component)
// Uses the same hero image used in HeroSection to provide a global background.
// Content floats above via normal stacking context.
export default function GlobalHeroBackground({
  src = "/feathers-6365294_1920.jpg",
  className = "",
  overlayOpacity = 0.25, // Default overlay opacity (higher value = darker overlay)
}: {
  src?: string;
  className?: string;
  overlayOpacity?: number;
}) {
  return (
    <div className={`global-hero-bg relative ${className}`} aria-hidden="true">
      {/* Background image */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          // place under aurora (-1) so aurora colors can glow above image
          zIndex: -3,
          backgroundImage: `url('${src}')`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      {/* Darker, gray overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundColor: `rgba(45, 55, 72, ${overlayOpacity})`, // Dark slate gray with configurable opacity
        }}
      />
    </div>
  );
}
