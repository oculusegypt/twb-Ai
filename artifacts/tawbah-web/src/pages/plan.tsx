import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Check, Flame, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { useAppUserProgress, useAppHabits, useAppCompleteHabit } from "@/hooks/use-app-data";

const DEFAULT_HABITS = [
  { key: "istighfar_100", label: "ورد الاستغفار (100 مرة)" },
  { key: "quran", label: "قراءة صفحة من القرآن" },
  { key: "witr", label: "صلاة الوتر" },
  { key: "sayyid", label: "سيد الاستغفار (صباحاً ومساءً)" },
];

export default function Plan() {
  const { data: progress } = useAppUserProgress();
  const { data: habits, isLoading: loadingHabits } = useAppHabits();
  const completeHabit = useAppCompleteHabit();

  const handleToggle = (habitKey: string, currentStatus: boolean) => {
    completeHabit.mutate({ habitKey, completed: !currentStatus });
  };

  const completedCount = useMemo(() => {
    if (!habits) return 0;
    return habits.filter(h => h.completed).length;
  }, [habits]);

  const progressPercent = Math.round((completedCount / DEFAULT_HABITS.length) * 100);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="bg-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] text-primary-foreground shadow-lg relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-white drop-shadow-sm mb-1">خطة التعافي</h1>
              <p className="text-primary-foreground/80 text-sm flex items-center gap-1.5">
                <CalendarIcon size={14} />
                <span>{format(new Date(), "yyyy-MM-dd")}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Flame size={18} className="text-accent" />
              <span className="font-bold text-lg text-white">{progress?.streakDays || 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/90">إنجاز اليوم</span>
            <span className="text-sm font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              className="h-full bg-accent relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "shimmer 2s infinite" }} />
            </motion.div>
          </div>
          <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
        </div>
      </div>

      <div className="flex-1 p-6 -mt-4">
        <div className="bg-card rounded-2xl p-5 shadow-xl shadow-black/5 border border-border mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-accent" size={20} />
            <h2 className="font-bold text-lg">اليوم {progress?.day40Progress || 1} من 40</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            الاستمرار هو سر النجاح. لا تستهن بهذه العادات البسيطة، فهي حصنك المنيع.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {loadingHabits ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            DEFAULT_HABITS.map((def, i) => {
              const habit = habits?.find(h => h.habitKey === def.key);
              const isCompleted = habit?.completed || false;

              return (
                <motion.button
                  key={def.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleToggle(def.key, isCompleted)}
                  className={`flex items-center p-4 rounded-xl border text-right transition-all duration-300 ${
                    isCompleted 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-card border-border shadow-sm hover:border-primary/40"
                  }`}
                >
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ml-4 shrink-0 transition-all duration-300 ${
                    isCompleted ? "bg-primary border-primary text-white scale-110" : "bg-muted border-muted-foreground/30"
                  }`}>
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className={`font-bold text-sm transition-colors duration-300 ${
                    isCompleted ? "text-primary line-through opacity-70" : "text-foreground"
                  }`}>
                    {def.label}
                  </span>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
