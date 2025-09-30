"use client";

import { motion } from "framer-motion";
import { Truck, Shield, Star, Headphones } from "lucide-react";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";

const features = [
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Quick and reliable delivery to your doorstep",
    gradient: "from-blue-500/20 via-cyan-500/20 to-blue-500/20",
    iconColor: "text-blue-200",
    glow: "group-hover:shadow-blue-500/50",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Your transactions are safe and encrypted",
    gradient: "from-emerald-500/20 via-teal-500/20 to-emerald-500/20",
    iconColor: "text-emerald-200",
    glow: "group-hover:shadow-emerald-500/50",
  },
  {
    icon: Star,
    title: "Quality Products",
    description: "Handpicked items from trusted vendors",
    gradient: "from-amber-500/20 via-yellow-500/20 to-amber-500/20",
    iconColor: "text-amber-200",
    glow: "group-hover:shadow-amber-500/50",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help whenever you need us",
    gradient: "from-purple-500/20 via-pink-500/20 to-purple-500/20",
    iconColor: "text-purple-200",
    glow: "group-hover:shadow-purple-500/50",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Why Choose Us
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your satisfaction is our priority
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <HeroLiquidGlass className={`h-full hover:shadow-2xl ${feature.glow} transition-all duration-500`} padding="0" cornerRadius={24}>
                  <div className="p-6 h-full flex flex-col items-center text-center transition-all duration-500 group-hover:scale-[1.03] relative overflow-hidden">
                    {/* Animated gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Floating orb effect */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
                    
                    {/* Sparkle effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '150ms' }} />
                      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '300ms' }} />
                    </div>
                    
                    <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 group-hover:border-white/40 group-hover:shadow-lg transition-all duration-300">
                        <Icon className={`h-8 w-8 ${feature.iconColor} group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`} />
                      </div>
                      <h3 className="font-bold text-zinc-100 mb-2 text-lg">{feature.title}</h3>
                      <p className="text-zinc-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </HeroLiquidGlass>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
