import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lock, Star, Trophy, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { getSessionId } from "@/lib/session";

interface JourneyDay {
  day: number;
  title: string;
  tasks: string[];
  verse: string;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

interface JourneyData {
  days: JourneyDay[];
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

export default function Journey30() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const { data, isLoading } = useQuery<JourneyData>({
    queryKey: ["journey30", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/journey30?sessionId=${encodeURIComponent(sessionId)}`);
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: false,
  });

  const completeMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const res = await fetch("/api/journey30/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, dayNumber }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = (data.completedCount / 30) * 100;

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-6 gap-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold mb-1">رحلة ٣٠ يوماً</h1>
        <p className="text-sm text-muted-foreground">طريق التوبة خطوة بخطوة</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={22} />
            <span className="font-bold text-lg">{data.completedCount} / 30 يوم</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              يوم {data.currentDay}
            </span>
          </div>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {data.completedCount === 30
            ? "🎉 أكملت رحلة الـ 30 يوم — بارك الله فيك!"
            : `${30 - data.completedCount} يوم متبقٍ للإنجاز`}
        </p>
      </motion.div>

      {data.completedCount === 30 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-2xl p-5 border border-amber-400/30 text-center"
        >
          <Trophy size={48} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">تهانينا! أتممت الرحلة 🎉</h2>
          <p className="text-sm text-muted-foreground">
            أتممت رحلة الثلاثين يوماً — سجّل الله لك هذا الجهد وقبل منك التوبة إن شاء الله
          </p>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        {data.days.map((day, idx) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
          >
            <div
              className={`rounded-2xl border transition-all ${
                day.completed
                  ? "bg-primary/5 border-primary/20 opacity-80"
                  : day.isCurrent
                  ? "bg-card border-primary/40 shadow-lg shadow-primary/10"
                  : day.isLocked
                  ? "bg-muted/30 border-border opacity-50"
                  : "bg-card border-border"
              }`}
            >
              <button
                className="w-full flex items-center gap-3 p-4 text-right"
                onClick={() => !day.isLocked && setExpandedDay(expandedDay === day.day ? null : day.day)}
                disabled={day.isLocked}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    day.completed
                      ? "bg-primary text-primary-foreground"
                      : day.isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.completed ? (
                    <CheckCircle2 size={20} />
                  ) : day.isLocked ? (
                    <Lock size={16} />
                  ) : (
                    day.day
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{day.title}</span>
                    {day.isCurrent && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                        اليوم
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">اليوم {day.day}</span>
                </div>
                {!day.isLocked && (
                  expandedDay === day.day ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )
                )}
              </button>

              <AnimatePresence>
                {expandedDay === day.day && !day.isLocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex flex-col gap-4">
                      <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                        <p className="text-sm font-medium text-center text-primary leading-relaxed">
                          {day.verse}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground mb-2">مهام اليوم:</h4>
                        <div className="flex flex-col gap-2">
                          {day.tasks.map((task, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold">{i + 1}</span>
                              </div>
                              <span className="text-sm">{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!day.completed && (
                        <button
                          onClick={() => completeMutation.mutate(day.day)}
                          disabled={completeMutation.isPending}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {completeMutation.isPending ? "يتم الحفظ..." : "✓ أكملت مهام هذا اليوم"}
                        </button>
                      )}

                      {day.completed && (
                        <div className="flex items-center justify-center gap-2 py-2 text-primary">
                          <CheckCircle2 size={18} />
                          <span className="font-bold text-sm">أُنجز بحمد الله</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
