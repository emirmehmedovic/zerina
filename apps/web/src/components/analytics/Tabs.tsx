"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({ tabs }: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  return (
    <div>
      <div className="flex space-x-1 border-b border-white/10 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-200 ${selectedTab === tab.id ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
            {selectedTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                layoutId="underline"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tabs.find((tab) => tab.id === selectedTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
