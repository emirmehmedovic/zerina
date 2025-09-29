"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuroraBackground from "@/components/ui/aurora-background";
import GlobalHeroBackground from "@/components/ui/global-hero-background";

interface ConditionalNavbarFooterProps {
  children: React.ReactNode;
}

export default function ConditionalNavbarFooter({ children }: ConditionalNavbarFooterProps) {
  const pathname = usePathname();
  
  // Don't show navbar and footer in admin and dashboard sections
  const isAdminRoute = pathname?.startsWith('/admin');
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const showNavbarFooter = !isAdminRoute && !isDashboardRoute;
  
  return (
    <>
      {showNavbarFooter && <GlobalHeroBackground />}
      {showNavbarFooter && <AuroraBackground />}
      
      {showNavbarFooter && <Navbar />}
      <main className={`w-full mx-auto ${showNavbarFooter ? 'py-8 mt-10' : ''}`}>
        {children}
      </main>
      {showNavbarFooter && <Footer />}
    </>
  );
}
