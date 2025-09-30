"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import HeroLiquidGlass from "./ui/HeroLiquidGlass";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Verified Buyer",
    avatar: "SJ",
    rating: 5,
    text: "Amazing quality and fast shipping! The handcrafted items exceeded my expectations. Will definitely order again.",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Regular Customer",
    avatar: "MC",
    rating: 5,
    text: "Love the variety of unique products. The liquid glass design makes shopping a delightful experience.",
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "First Time Buyer",
    avatar: "EW",
    rating: 5,
    text: "Excellent customer service and beautiful products. The attention to detail is remarkable.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            What Our Customers Say
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Real reviews from real people
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <HeroLiquidGlass className="h-full" padding="0" cornerRadius={24}>
                <div className="p-6 h-full flex flex-col relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-white/20" />
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-400/30 to-zinc-600/30 flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <span className="text-zinc-100 font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-100">{testimonial.name}</h4>
                      <p className="text-xs text-zinc-300">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-zinc-200 text-sm leading-relaxed flex-1">
                    "{testimonial.text}"
                  </p>
                </div>
              </HeroLiquidGlass>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
