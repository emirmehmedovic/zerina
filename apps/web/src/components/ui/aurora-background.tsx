import React from "react";

// Server component (no hooks) that renders a global animated aurora background layer
// Usage:
//   <AuroraBackground />
// Or wrap content:
//   <AuroraBackground>
//     <YourContent />
//   </AuroraBackground>
export function AuroraBackground({ children }: { children?: React.ReactNode }) {
  const layer = <div className="aurora-bg" aria-hidden="true" />;
  if (!children) return layer;
  return (
    <div className="relative">
      {layer}
      {children}
    </div>
  );
}

export default AuroraBackground;
