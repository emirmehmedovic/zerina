"use client";

import Link from "next/link";
import { Sparkles, ShoppingBag, Grid2x2, Store } from "lucide-react";
import { useState } from "react";

export default function CTASection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-8 sm:p-10 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-rose-100/60 blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left (50%): Shopper CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 p-6 flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-rose-100/70 text-amber-900 text-xs font-semibold mb-3">
                  <Sparkles className="w-4 h-4" />
                  Curated for you
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-2">Find artisan pieces you’ll love</h2>
                <p className="text-gray-600 mb-4">Shop handpicked, handcrafted goods from real makers. Gentle colors, thoughtful details—everything chosen to inspire.</p>
                <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link href="/products" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow transition-all duration-200">
                    <ShoppingBag className="w-5 h-5" />
                    Shop Now
                  </Link>
                  <Link href="/categories" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-white border border-gray-200/80 text-gray-800 font-medium shadow-sm hover:shadow transition-all duration-200">
                    <Grid2x2 className="w-5 h-5" />
                    Explore Categories
                  </Link>
                </div>
              </div>

              {/* Right (50%): stacked cards */}
              <div className="grid grid-cols-1 gap-6 items-stretch">
                {/* Card 2: Stay Updated */}
                <div className="rounded-2xl bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 border border-rose-100/60 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col items-center text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Stay Updated</h3>
                  <p className="text-gray-600 mb-4">New arrivals, artisan stories, and seasonal offers—straight to your inbox.</p>
                  <div className="w-full"><NewsletterInlineForm /></div>
                </div>

                {/* Card 3: Seller CTA */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 p-6 flex flex-col">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-amber-100/70 text-amber-900 text-xs font-semibold mb-3">
                    <Store className="w-4 h-4" />
                    For creators & makers
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">Turn your craft into a brand</h3>
                  <p className="text-gray-600 mb-4">Open a beautiful storefront in minutes. Showcase your process, list products, and reach shoppers who value handmade.</p>
                  <div className="mt-auto">
                    <Link href="/dashboard/shop" className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-100/80 hover:bg-rose-100 border border-rose-200/80 text-amber-900 font-medium shadow-sm hover:shadow transition-all duration-200">
                      <Store className="w-5 h-5" />
                      Start Selling
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterInlineForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus("error");
    setStatus("loading");
    try {
      // Placeholder: wire up to your newsletter endpoint here
      await new Promise((r) => setTimeout(r, 600));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-xl flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 rounded-full bg-white/80 border border-gray-200/80 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-rose-100/80 hover:bg-rose-100 border border-rose-200/80 text-amber-900 font-medium shadow-sm hover:shadow disabled:opacity-70"
      >
        {status === "loading" ? "Subscribing…" : status === "success" ? "Subscribed ✓" : "Subscribe"}
      </button>
      {status === "error" && (
        <span className="block w-full text-center text-sm text-rose-700">Please enter a valid email.</span>
      )}
    </form>
  );
}
