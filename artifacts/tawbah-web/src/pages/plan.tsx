import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Calendar as CalendarIcon, Sparkles, BookOpen, Eye } from "lucide-react";
import { useAppUserProgress, useAppHabits, useAppCompleteHabit } from "@/hooks/use-app-data";

const JOURNEY_PHASES = [
  {
    phase: 1,
    days: "الأيام 1-10",
    title: "التعافي الأولي",
    color: "bg-blue-500/10 border-blue-400/30 text-blue-600",
    dot: "bg-blue-500",
    focus: "تكسير العادة القديمة وتأسيس الصلة بالله",
    habits: [
      { icon: "🤲", name: "ورد الاستغفار (100 مرة)", timing: "في أي وقت" },
      { icon: "📖", name: "قراءة صفحتين من القرآن", timing: "بعد الفجر" },
      { icon: "🌙", name: "صلاة الوتر", timing: "قبل النوم" },
      { icon: "🌅", name: "سيد الاستغفار صباحاً", timing: "بعد الفجر" },
      { icon: "🌆", name: "سيد الاستغفار مساءً", timing: "بعد العصر" },
    ],
    advice: "ركّز في هذه المرحلة على قطع الأسباب والبيئة المحيطة. لا تسمح لنفسك بأي موقف قد يُعيدك للذنب.",
  },
  {
    phase: 2,
    days: "الأيام 11-20",
    title: "بناء العادات",
    color: "bg-green-500/10 border-green-400/30 text-green-600",
    dot: "bg-green-500",
    focus: "ترسيخ العبادة اليومية وبناء نمط حياة جديد",
    habits: [
      { icon: "🤲", name: "ورد الاستغفار (100 مرة)", timing: "في أي وقت" },
      { icon: "📖", name: "قراءة صفحتين من القرآن", timing: "بعد الفجر" },
      { icon: "🌙", name: "صلاة الوتر", timing: "قبل النوم" },
      { icon: "🌅", name: "سيد الاستغفار صباحاً", timing: "بعد الفجر" },
      { icon: "🌆", name: "سيد الاستغفار مساءً", timing: "بعد العصر" },
      { icon: "💧", name: "صيام يوم تطوعي", timing: "الاثنين أو الخميس" },
    ],
    advice: "ستشعر في هذه المرحلة ببعض الراحة. لا تتراخَ، بل أضف عملاً صالحاً جديداً كل أسبوع.",
  },
  {
    phase: 3,
    days: "الأيام 21-30",
    title: "الثبات والرسوخ",
    color: "bg-primary/10 border-primary/30 text-primary",
    dot: "bg-primary",
    focus: "تعميق العلاقة مع الله ومحاسبة النفس يومياً",
    habits: [
      { icon: "🤲", name: "ورد الاستغفار (100 مرة)", timing: "في أي وقت" },
      { icon: "📖", name: "قراءة صفحتين من القرآن", timing: "بعد الفجر" },
      { icon: "🌙", name: "صلاة الوتر", timing: "قبل النوم" },
      { icon: "🌅", name: "سيد الاستغفار صباحاً", timing: "بعد الفجر" },
      { icon: "🌆", name: "سيد الاستغفار مساءً", timing: "بعد العصر" },
      { icon: "✍️", name: "الكتابة في اليوميات", timing: "قبل النوم" },
    ],
    advice: "الآن أصبحت العادة راسخة. ابدأ بمحاسبة نفسك كل ليلة: ما أحسنت فيه؟ وما تحتاج لتحسينه؟",
  },
  {
    phase: 4,
    days: "الأيام 31-40",
    title: "النضج الروحي",
    color: "bg-amber-500/10 border-amber-400/30 text-amber-600",
    dot: "bg-amber-500",
    focus: "الإعداد للاستمرار ما بعد الـ 40 يوماً",
    habits: [
      { icon: "🤲", name: "ورد الاستغفار (100 مرة)", timing: "في أي وقت" },
      { icon: "📖", name: "قراءة صفحتين من القرآن", timing: "بعد الفجر" },
      { icon: "🌙", name: "صلاة الوتر", timing: "قبل النوم" },
      { icon: "🌅", name: "سيد الاستغفار صباحاً", timing: "بعد الفجر" },
      { icon: "🌆", name: "سيد الاستغفار مساءً", timing: "بعد العصر" },
      { icon: "🎯", name: "تحديد هدف روحي جديد", timing: "بداية الأسبوع" },
    ],
    advice: "أنت الآن في المرحلة الأخيرة. لا تعتقد أن الأمر انتهى - هذا هو البداية الحقيقية للحياة الجديدة.",
  },
];

type TabType = "today" | "journey";

export default function Plan() {
  const { data: progress } = useAppUserProgress();
  const { data: habits, isLoading: loadingHabits } = useAppHabits();
  const completeHabit = useAppCompleteHabit();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const handleToggle = (habitKey: string, currentStatus: boolean) => {
    completeHabit.mutate({ habitKey, completed: !currentStatus });
  };

  const completedCount = habits?.filter(h => h.completed).length || 0;
  const totalCount = habits?.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const currentDay = progress?.day40Progress || 1;
  const currentPhaseIndex = Math.min(Math.floor((currentDay - 1) / 10), 3);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="bg-primary px-6 pt-10 pb-8 rounded-b-[2.5rem] text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-5">
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
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "today" ? "bg-white text-primary" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Sparkles size={14} />
              اليوم {currentDay}
            </button>
            <button
              onClick={() => setActiveTab("journey")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "journey" ? "bg-white text-primary" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <Eye size={14} />
              الرحلة كاملة
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "today" ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex-1 p-6 -mt-4"
          >
            <div className="bg-card rounded-2xl p-5 shadow-xl shadow-black/5 border border-border mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-accent" size={20} />
                <h2 className="font-bold text-lg">اليوم {currentDay} من 40</h2>
                <span className={`mr-auto text-xs font-bold px-2 py-0.5 rounded-full ${JOURNEY_PHASES[currentPhaseIndex].color}`}>
                  {JOURNEY_PHASES[currentPhaseIndex].title}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                الاستمرار هو سر النجاح. لا تستهن بهذه العادات البسيطة، فهي حصنك المنيع.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {loadingHabits ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />)}
                </div>
              ) : habits && habits.length > 0 ? (
                habits.map((habit, i) => {
                  const isCompleted = habit.completed;
                  return (
                    <motion.button
                      key={habit.habitKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleToggle(habit.habitKey, isCompleted)}
                      disabled={completeHabit.isPending}
                      className={`flex items-center p-4 rounded-xl border text-right transition-all duration-300 w-full ${
                        isCompleted
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border shadow-sm hover:border-primary/40 active:scale-[0.98]"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ml-4 shrink-0 transition-all duration-300 ${
                        isCompleted ? "bg-primary border-primary text-white scale-110" : "bg-transparent border-muted-foreground/30"
                      }`}>
                        {isCompleted && <Check size={16} strokeWidth={3} />}
                      </div>
                      <span className={`font-bold text-sm transition-colors duration-300 ${
                        isCompleted ? "text-primary line-through opacity-70" : "text-foreground"
                      }`}>
                        {habit.habitNameAr}
                      </span>
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  لم يتم تحميل العادات بعد
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="journey"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex-1 p-5 -mt-4"
          >
            <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-primary" />
                <h2 className="font-bold text-sm">خريطة الـ 40 يوم</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                تصفّح الخطة بالكامل في أي وقت. الإنجاز اليومي متاح فقط في يومه.
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {Array.from({ length: 40 }, (_, i) => {
                  const day = i + 1;
                  const done = day < currentDay;
                  const today = day === currentDay;
                  const future = day > currentDay;
                  return (
                    <div
                      key={day}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all ${
                        done ? "bg-primary text-primary-foreground" :
                        today ? "bg-primary/20 text-primary border-2 border-primary" :
                        future ? "bg-muted text-muted-foreground/50" : ""
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {JOURNEY_PHASES.map((phase) => {
                const isExpanded = expandedPhase === phase.phase;
                const isCurrent = phase.phase === currentPhaseIndex + 1;
                const isPast = phase.phase < currentPhaseIndex + 1;

                return (
                  <motion.div
                    key={phase.phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: phase.phase * 0.07 }}
                    className={`bg-card rounded-xl border overflow-hidden transition-all ${
                      isCurrent ? "border-primary/40 shadow-md" : "border-border"
                    }`}
                  >
                    <button
                      className="w-full flex items-center gap-3 p-4 text-right"
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isPast ? "bg-primary text-primary-foreground" :
                        isCurrent ? "bg-primary/20 border-2 border-primary text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {isPast ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{phase.phase}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{phase.title}</p>
                          {isCurrent && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">الآن</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{phase.days}</p>
                      </div>
                      <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 space-y-3">
                            <div className={`p-3 rounded-lg border ${phase.color}`}>
                              <p className="text-xs font-bold mb-0.5">التركيز الأساسي</p>
                              <p className="text-xs">{phase.focus}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground mb-2">العادات اليومية</p>
                              <div className="space-y-1.5">
                                {phase.habits.map((h, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                                    <span className="text-base">{h.icon}</span>
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-foreground">{h.name}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{h.timing}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-400/30 rounded-lg p-3">
                              <span className="text-base">💡</span>
                              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{phase.advice}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
