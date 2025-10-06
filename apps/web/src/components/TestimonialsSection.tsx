"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

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
        <div className="bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-rose-100/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">What Our Customers Say</h2>
            <p className="text-gray-600">Real reviews from real people</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                <div className="h-full rounded-2xl bg-gradient-to-br from-amber-50/40 via-white/60 to-rose-50/40 border border-white/40 shadow-sm hover:shadow-md hover:border-white/60 transition-all duration-300 p-6 relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-amber-900/20" />

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/80 border border-rose-100/70 flex items-center justify-center shadow-sm">
                      <span className="text-amber-900 font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                      <p className="text-xs text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">
                    &quot;{testimonial.text}&quot;
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
