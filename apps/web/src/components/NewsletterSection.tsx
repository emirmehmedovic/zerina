"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group"
        >
          <HeroLiquidGlass className="w-full hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-500" padding="0" cornerRadius={32}>
            <div className="p-8 sm:p-12 text-center relative overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Floating orbs */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              
              {/* Sparkle effects */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
                <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
                <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '600ms' }} />
              </div>
              
              <div className="relative z-10">
                <motion.div 
                  className="mb-6 inline-block p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 group-hover:border-indigo-400/40 group-hover:shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Mail className="h-8 w-8 text-indigo-200 group-hover:text-indigo-100 transition-colors" />
                </motion.div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3 group-hover:scale-105 transition-transform duration-300">
                  Stay Updated
                </h2>
                <p className="text-zinc-300 mb-8 max-w-xl mx-auto">
                  Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special promotions.
                </p>

                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-all"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={status === "loading"}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-4 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 hover:from-indigo-500/40 hover:to-purple-500/40 backdrop-blur-sm border border-indigo-400/30 text-zinc-100 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {status === "loading" ? (
                        <div className="w-5 h-5 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin" />
                      ) : status === "success" ? (
                        "Subscribed!"
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span className="hidden sm:inline">Subscribe</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                  {status === "success" && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-emerald-400 text-sm mt-3 font-medium"
                    >
                      ✨ Thank you for subscribing!
                    </motion.p>
                  )}
                </form>
              </div>
            </div>
          </HeroLiquidGlass>
        </motion.div>
      </div>
    </section>
  );
}
