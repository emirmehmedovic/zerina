"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ConditionalNavbarFooterProps {
  children: React.ReactNode;
}

export default function ConditionalNavbarFooter({ children }: ConditionalNavbarFooterProps) {
  const pathname = usePathname();
  // Determine visibility purely from pathname so SSR/CSR output is identical
  const showNavbarFooter = useMemo(() => {
    const admin = pathname?.startsWith("/admin") ?? false;
    const dashboard = pathname?.startsWith("/dashboard") ?? false;
    return !admin && !dashboard;
  }, [pathname]);

  return (
    <div>
      {showNavbarFooter && <Navbar />}
      <main className={`w-full mx-auto ${showNavbarFooter ? 'pt-16 md:pt-20' : ''}`}>
        {children}
      </main>
      {showNavbarFooter && <Footer />}
    </div>
  );
}
