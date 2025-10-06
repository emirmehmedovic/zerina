"use client";

import { motion } from "framer-motion";
import { Truck, Shield, Star, Headphones } from "lucide-react";

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
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Why Choose Us</h2>
            <p className="text-gray-600">Your satisfaction is our priority</p>
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
                  transition={{ delay: index * 0.08 }}
                  className="group"
                >
                  <div className={`h-full rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 p-6 text-center`}> 
                    <div className="mb-4 inline-flex p-4 rounded-2xl bg-white/70 border border-rose-100/70 shadow-sm group-hover:shadow">
                      <Icon className={`h-7 w-7 text-amber-800/90`} />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 text-lg">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
