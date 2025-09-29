"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import LiquidGlass from './ui/LiquidGlass';
import HeaderAuth from './HeaderAuth';
import CartLink from './CartLink';
import SearchBar from './ui/SearchBar';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const links = [
    { href: '/products', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
    { href: '/shops', label: 'Sellers' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch when using client-only data like pathname
    setMounted(true);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="max-w-9xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
        <LiquidGlass
          cornerRadius={24}
          padding="0"
          className="w-full"
        >
          <nav className="w-full px-4 md:px-6 py-2 flex items-center justify-between gap-2 md:gap-3 text-white">
            {/* Left: Logo + Links */}
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/" className="text-xl font-semibold text-white shrink-0">
                Zerina
              </Link>
              <div className="hidden md:flex items-center gap-1.5">
                {links.map((l) => {
                  const active = mounted && (pathname === l.href || pathname?.startsWith(l.href + '/'));
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`px-2.5 py-1.5 rounded-full text-sm transition-colors ${
                        active ? 'bg-white/30' : 'hover:bg-white/20'
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Search + Cart + Auth (tri stavke) */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:block">
                <SearchBar compact />
              </div>
              <CartLink />
              <HeaderAuth />
              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </nav>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden px-6 py-4 border-t border-white/10 text-white">
              <div className="flex flex-col space-y-3">
                <div className="pb-2">
                  <SearchBar className="w-full" />
                </div>
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="px-3 py-2 rounded-lg hover:bg-white/10">
                    {l.label}
                  </Link>
                ))}
                <div className="pt-2 flex items-center justify-between">
                  <CartLink />
                  <HeaderAuth />
                </div>
              </div>
            </div>
          )}
        </LiquidGlass>
      </div>
    </div>
  );
}
