"use client";

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface Insight {
  text: string;
}

interface KeyInsightsProps {
  insights: Insight[];
}

export default function KeyInsights({ insights }: KeyInsightsProps) {
  return (
    <motion.div 
      className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="h-6 w-6 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Key Insights</h2>
      </div>
      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <motion.li 
            key={i}
            className="flex items-start gap-3 text-zinc-300"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <span className="text-amber-400 mt-1">•</span>
            <span>{insight.text}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
