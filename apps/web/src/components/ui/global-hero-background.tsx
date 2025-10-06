import React from "react";

// Fixed, full-viewport background image layer (server component)
// Uses the same hero image used in HeroSection to provide a global background.
// Content floats above via normal stacking context.
export default function GlobalHeroBackground({
  src = "/feathers-6365294_1920.jpg",
  className = "",
  overlayOpacity = 0.25, // Default overlay opacity (higher value = darker overlay)
  useImage = true,
}: {
  src?: string;
  className?: string;
  overlayOpacity?: number;
  useImage?: boolean;
}) {
  return (
    <div className={`global-hero-bg relative ${className}`} aria-hidden="true">
      {/* SVG noise texture definition */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 0.05" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Background image (optional) */}
      {useImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -10,
            backgroundImage: `url('${src}')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Darker, gray overlay (only when image is used) */}
      {useImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -9,
            backgroundColor: `rgba(45, 55, 72, ${overlayOpacity})`,
          }}
        />
      )}

      {/* Subtle white gradient with texture - now on top */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -8,
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.08) 0%,
              rgba(248, 250, 252, 0.15) 25%,
              rgba(241, 245, 249, 0.20) 50%,
              rgba(248, 250, 252, 0.15) 75%,
              rgba(255, 255, 255, 0.08) 100%
            )
          `,
          filter: "url(#noise)",
          mixBlendMode: "soft-light",
          opacity: 0.9,
        }}
      />

      {/* Additional radial glow for depth */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -7,
          background: `
            radial-gradient(
              ellipse at 50% 30%,
              rgba(255, 255, 255, 0.25) 0%,
              rgba(255, 255, 255, 0.10) 40%,
              transparent 70%
            )
          `,
          mixBlendMode: "overlay",
          opacity: 0.8,
        }}
      />
    </div>
  );
}
