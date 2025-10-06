"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20">
      <div className="max-w-9xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="w-full px-6 py-8 rounded-3xl bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 border border-rose-100/60 backdrop-blur-sm shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">Handcrafted marketplace</div>
                <Link href="/" className="text-2xl font-bold text-amber-900 mb-2 block">Zerina</Link>
                <p className="text-amber-800/90 text-sm leading-relaxed max-w-xs">
                  Discover thoughtfully curated, handcrafted products from independent makers.
                </p>
              </div>

              {/* Quick Links */}
              <div className="md:col-span-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">Quick Links</div>
                <ul className="space-y-2">
                  <li><Link href="/products" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Browse Products</Link></li>
                  <li><Link href="/categories" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Categories</Link></li>
                  <li><Link href="/shops" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Featured Shops</Link></li>
                  <li><Link href="/about" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">About Us</Link></li>
                </ul>
              </div>

              {/* For Sellers */}
              <div className="md:col-span-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">For Sellers</div>
                <ul className="space-y-2">
                  <li><Link href="/dashboard/shop" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Start Selling</Link></li>
                  <li><Link href="/seller-guide" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Seller Guide</Link></li>
                  <li><Link href="/support" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Support</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="md:col-span-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">Legal</div>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Cookie Policy</Link></li>
                  <li><Link href="/contact" className="text-amber-800 hover:text-amber-900 hover:underline underline-offset-4 transition-colors text-sm">Contact</Link></li>
                </ul>
              </div>
          </div>

          {/* Trust & Payments Strip */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-amber-800/90">Secure checkout powered by trusted providers</div>
              <div className="flex items-center gap-3 opacity-90">
                {/* Placeholder payment icons */}
                <div className="px-2 py-1 rounded-md bg-white/80 border border-gray-200 text-gray-700 text-xs">VISA</div>
                <div className="px-2 py-1 rounded-md bg-white/80 border border-gray-200 text-gray-700 text-xs">Mastercard</div>
                <div className="px-2 py-1 rounded-md bg-white/80 border border-gray-200 text-gray-700 text-xs">Amex</div>
                <div className="px-2 py-1 rounded-md bg-white/80 border border-gray-200 text-gray-700 text-xs">PayPal</div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 mt-6 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-amber-700 text-sm">© {new Date().getFullYear()} Zerina. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/github" className="text-amber-700 hover:text-amber-900 transition-colors inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/70 border border-gray-200" aria-label="GitHub">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </Link>
                  <Link href="/linkedin" className="text-amber-700 hover:text-amber-900 transition-colors inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/70 border border-gray-200" aria-label="LinkedIn">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Link>
                </div>
              <div className="flex items-center gap-3">
                <select className="bg-white/70 border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700">
                  <option>EN</option>
                  <option>DE</option>
                </select>
                <select className="bg-white/70 border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700">
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
