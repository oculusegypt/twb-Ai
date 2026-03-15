import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDhikrCount, useAppIncrementDhikr } from "@/hooks/use-app-data";
import type { IncrementDhikrRequestDhikrType } from "@workspace/api-client-react";

type DhikrTab = {
  id: IncrementDhikrRequestDhikrType;
  label: string;
  target: number;
  text: string;
};

const TABS: DhikrTab[] = [
  { id: "istighfar", label: "الاستغفار", target: 100, text: "أستغفر الله العظيم وأتوب إليه" },
  { id: "tasbih", label: "التسبيح", target: 33, text: "سبحان الله وبحمده سبحان الله العظيم" },
  { id: "sayyid", label: "سيد الاستغفار", target: 1, text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ..." },
];

export default function Dhikr() {
  const [activeTab, setActiveTab] = useState<IncrementDhikrRequestDhikrType>("istighfar");
  const { data: counts } = useAppDhikrCount();
  const increment = useAppIncrementDhikr();
  const [clickEffect, setClickEffect] = useState(false);

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const currentCount = counts?.[activeTab] || 0;
  const progress = Math.min(100, (currentCount / currentTab.target) * 100);

  const handleTap = () => {
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 150);
    
    // Optimistic UI could be added here, but mutation handles it
    increment.mutate({ dhikrType: activeTab, amount: 1 });
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background p-6">
      <h1 className="text-2xl font-display font-bold text-center mt-4 mb-6">مسبحة الذكر</h1>

      <div className="flex bg-muted/50 p-1.5 rounded-xl mb-8">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                isActive ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-10 w-full"
          >
            <p className="text-xl font-display text-foreground leading-loose px-4">
              {currentTab.text}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative mb-12">
          {/* Progress Ring */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128" cy="128" r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted"
            />
            <motion.circle
              cx="128" cy="128" r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={120 * 2 * Math.PI}
              initial={{ strokeDashoffset: 120 * 2 * Math.PI }}
              animate={{ strokeDashoffset: (120 * 2 * Math.PI) - ((progress / 100) * (120 * 2 * Math.PI)) }}
              className="text-primary transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>

          {/* Tap Button */}
          <button
            onClick={handleTap}
            className="absolute inset-4 rounded-full bg-card shadow-xl flex flex-col items-center justify-center border-4 border-background active:bg-muted/30 transition-colors tap-highlight-transparent"
          >
            <motion.div
              animate={clickEffect ? { scale: 0.9 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex flex-col items-center"
            >
              <span className="text-5xl font-display font-bold text-primary mb-1">
                {currentCount}
              </span>
              <span className="text-xs text-muted-foreground font-bold">
                من {currentTab.target}
              </span>
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
}
