import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress, useAppDhikrCount, useAppHabits } from "@/hooks/use-app-data";
import { CircleDot, PenLine, TrendingUp, Heart, ChevronLeft, Sparkles } from "lucide-react";

function useSoulScore() {
  const { data: progress } = useAppUserProgress();
  const { data: dhikr } = useAppDhikrCount();
  const { data: habits } = useAppHabits();

  const streak = progress?.streakDays ?? 0;
  const dhikrTotal = (dhikr?.istighfar ?? 0) + (dhikr?.tasbih ?? 0) + (dhikr?.sayyid ?? 0);
  const dhikrTarget = 99;
  const habitsTotal = habits?.length ?? 0;
  const habitsDone = habits?.filter(h => h.completed).length ?? 0;
  const journalDone = false;

  const streakScore = Math.min(streak * 5, 40);
  const dhikrScore = Math.min((dhikrTotal / dhikrTarget) * 35, 35);
  const habitsScore = habitsTotal > 0 ? Math.min((habitsDone / habitsTotal) * 25, 25) : 0;

  const total = Math.round(streakScore + dhikrScore + habitsScore);

  let label = "";
  let color = "";
  let tip = "";
  let tipIcon: "dhikr" | "journal" | "habit" | "journey" = "dhikr";

  if (total >= 80) {
    label = "روح مشرقة ✨";
    color = "#16a34a";
    tip = "ما شاء الله — روحك في أعلى حالاتها اليوم. واظب وثبّت حالك!";
    tipIcon = "journey";
  } else if (total >= 55) {
    label = "على الطريق";
    color = "#d97706";
    tip = dhikrTotal < 33
      ? "أضف جرعة ذكر صغيرة — 33 استغفار تحرّك المقياس كثيراً"
      : habitsTotal > 0 && habitsDone < habitsTotal
        ? "أكمل بقية عاداتك اليومية لتضيء المقياس أكثر"
        : "عظيم — واصل على هذا الطريق";
    tipIcon = dhikrTotal < 33 ? "dhikr" : "habit";
  } else if (total >= 25) {
    label = "تحتاج دفعة";
    color = "#ea580c";
    tip = streak === 0
      ? "ابدأ رحلتك الآن — أول خطوة هي أصعبها ثم تتيسر"
      : "سبّح الآن 33 مرة — هذا وحده يحرّك مقياسك للأمام";
    tipIcon = streak === 0 ? "journey" : "dhikr";
  } else {
    label = "روح تطلب النجدة";
    color = "#dc2626";
    tip = "لا تيأس — حتى التوبة الصغيرة تضيء القلب. ابدأ بالذكر الآن";
    tipIcon = "dhikr";
  }

  return { score: total, label, color, tip, tipIcon, streak, dhikrTotal, habitsDone, habitsTotal };
}

const TIP_LINKS: Record<string, { href: string; label: string; icon: React.ReactNode }> = {
  dhikr: { href: "/dhikr", label: "افتح المسبحة", icon: <CircleDot size={13} /> },
  journal: { href: "/journal", label: "يومياتي", icon: <PenLine size={13} /> },
  habit: { href: "/progress", label: "عاداتي", icon: <TrendingUp size={13} /> },
  journey: { href: "/journey", label: "رحلتي", icon: <Heart size={13} /> },
};

function AnimatedGauge({ score, color }: { score: number; color: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 150);
    return () => clearTimeout(timer);
  }, [score]);

  const displayedDash = (displayed / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112" width={112} height={112}>
        <circle
          cx={56} cy={56} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={9}
          className="text-muted/25"
        />
        <circle
          cx={56} cy={56} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - displayedDash}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-3xl font-black leading-none" style={{ color }}>{displayed}</span>
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">/١٠٠</span>
      </div>
    </div>
  );
}

export function SoulMeter() {
  const { score, label, color, tip, tipIcon, streak, dhikrTotal, habitsDone, habitsTotal } = useSoulScore();
  const tipLink = TIP_LINKS[tipIcon];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-4 p-4 text-right"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <AnimatedGauge score={score} color={color} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={12} style={{ color }} />
            <span className="text-[11px] font-semibold text-muted-foreground">مقياس الروح</span>
          </div>
          <h3 className="text-base font-bold leading-tight mb-2" style={{ color }}>{label}</h3>
          <div className="w-full bg-muted/40 rounded-full h-1.5 mb-2.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {streak > 0 && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800/40">
                🔥 {streak} يوم
              </span>
            )}
            {dhikrTotal > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">
                ذكر ×{dhikrTotal}
              </span>
            )}
            {habitsTotal > 0 && (
              <span className="text-[10px] dark:bg-violet-950/40 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold border border-violet-200 dark:border-violet-800/40 bg-[#4241bfd9] text-[#ccc1e8]">
                عادات {habitsDone}/{habitsTotal}
              </span>
            )}
          </div>
        </div>
        <ChevronLeft
          size={15}
          className="text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(-90deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0.5 border-t border-border/50 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{tip}</p>
              <Link
                href={tipLink.href}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: color + "15",
                  color,
                  border: `1px solid ${color}40`,
                }}
              >
                {tipLink.icon}
                {tipLink.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
