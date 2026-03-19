import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, CheckCircle2, BookOpen, Moon, Star, Brain, ShieldAlert, TrendingDown } from "lucide-react";
import { useAppUserProgress, useAppDhikrCount, useAppHabits } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";
import { BadgesSection } from "@/components/badges";

interface DayRecord {
  date: string;
  habitsCompleted: number;
  habitsTotal: number;
  istighfar: number;
}

const MOTIVATIONAL = [
  "كل يوم تلتزم فيه هو انتصار جديد",
  "المداومة على القليل خير من الانقطاع في الكثير",
  "إن الله لا يمل حتى تملوا",
  "أحب الأعمال إلى الله أدومها وإن قلّ",
  "اليوم الذي تضبطه لا يُعوَّض",
];

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getSosStats(): { count: number; lastDate: string | null } {
  try {
    return {
      count: parseInt(localStorage.getItem("sos_count") || "0", 10),
      lastDate: localStorage.getItem("sos_last"),
    };
  } catch {
    return { count: 0, lastDate: null };
  }
}

function SmartInsights({ weekData, streakDays, sosCount }: {
  weekData: DayRecord[];
  streakDays: number;
  sosCount: number;
}) {
  if (weekData.length === 0) return null;

  const insights: { icon: string; text: string; color: string }[] = [];

  const dayRates = weekData.map(d => d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0);
  const avgRate = dayRates.reduce((s, r) => s + r, 0) / dayRates.length;
  const lastHalf = dayRates.slice(3);
  const firstHalf = dayRates.slice(0, 3);
  const lastAvg = lastHalf.reduce((s, r) => s + r, 0) / lastHalf.length;
  const firstAvg = firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length;
  const improving = lastAvg > firstAvg + 0.1;
  const declining = lastAvg < firstAvg - 0.1;

  const bestDayIndex = dayRates.indexOf(Math.max(...dayRates));
  const bestDay = weekData[bestDayIndex];
  const worstDayIndex = dayRates.indexOf(Math.min(...dayRates));
  const worstDay = weekData[worstDayIndex];

  const totalIstighfar = weekData.reduce((s, d) => s + d.istighfar, 0);
  const prevWeekIstighfar = totalIstighfar;

  if (improving) {
    insights.push({ icon: "📈", text: "أداؤك يتحسن! النصف الثاني من الأسبوع أفضل من الأول.", color: "text-emerald-600 dark:text-emerald-400" });
  } else if (declining) {
    insights.push({ icon: "⚠️", text: "لاحظنا تراجعاً طفيفاً — تذكّر أن الاستمرار هو الهدف.", color: "text-amber-600 dark:text-amber-400" });
  }

  if (avgRate >= 0.8) {
    insights.push({ icon: "🌟", text: "معدل أسبوعك ممتاز! أنت في المسار الصحيح.", color: "text-primary" });
  } else if (avgRate >= 0.5) {
    insights.push({ icon: "💪", text: "تقوم بجهد جيد — زيادة عادة واحدة يومياً ستصنع فرقاً.", color: "text-blue-600 dark:text-blue-400" });
  } else {
    insights.push({ icon: "🤲", text: "لا تيأس — حتى الاستغفار مرة واحدة يُحتسب لك.", color: "text-violet-600 dark:text-violet-400" });
  }

  if (bestDay && dayRates[bestDayIndex]! > 0) {
    const d = new Date(bestDay.date);
    insights.push({ icon: "🏆", text: `أفضل يوم لك هذا الأسبوع: ${DAY_NAMES[d.getDay()]} — استحضر ما أعانك فيه.`, color: "text-amber-600 dark:text-amber-400" });
  }

  if (streakDays >= 7) {
    insights.push({ icon: "🔥", text: `سلسلة ${streakDays} يوم متواصل — الله يحفظها لك في الميزان.`, color: "text-orange-500" });
  }

  if (totalIstighfar >= 700) {
    insights.push({ icon: "📿", text: `${totalIstighfar} استغفارة هذا الأسبوع — قلبك يصقله هذا الذكر.`, color: "text-emerald-600 dark:text-emerald-400" });
  }

  if (sosCount > 0) {
    insights.push({
      icon: "🛡️",
      text: `استخدمت زر الطوارئ ${sosCount} ${sosCount === 1 ? "مرة" : "مرات"} — هذا قوة، لا ضعف. طلبت الله في لحظة صعبة.`,
      color: "text-rose-600 dark:text-rose-400",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-4 mb-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain size={16} className="text-primary" />
        <h2 className="font-bold text-sm">تحليل ذكي لأسبوعك</h2>
      </div>
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-base shrink-0 mt-0.5">{ins.icon}</span>
            <p className={`text-xs leading-relaxed ${ins.color}`}>{ins.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ProgressChart() {
  const { data: progress } = useAppUserProgress();
  const { data: dhikr } = useAppDhikrCount();
  const { data: habits } = useAppHabits();
  const [weekData, setWeekData] = useState<DayRecord[]>([]);
  const [quote] = useState(() => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
  const sosStats = getSosStats();

  useEffect(() => {
    const sessionId = getSessionId();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    Promise.all(
      last7.map(async (date) => {
        try {
          const [habRes, dhRes] = await Promise.all([
            fetch(`/api/habits?sessionId=${encodeURIComponent(sessionId)}&date=${date}`),
            fetch(`/api/dhikr/count?sessionId=${encodeURIComponent(sessionId)}&date=${date}`),
          ]);
          const habData = habRes.ok ? await habRes.json() : [];
          const dhData = dhRes.ok ? await dhRes.json() : { istighfar: 0 };
          return {
            date,
            habitsCompleted: habData.filter((h: { completed: boolean }) => h.completed).length,
            habitsTotal: habData.length || 5,
            istighfar: dhData.istighfar || 0,
          };
        } catch {
          return { date, habitsCompleted: 0, habitsTotal: 5, istighfar: 0 };
        }
      })
    ).then(setWeekData);
  }, []);

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr);
    return DAY_NAMES[d.getDay()];
  };
  const isToday = (dateStr: string) => dateStr === new Date().toISOString().split("T")[0];

  const todayHabits = habits || [];
  const completedToday = todayHabits.filter((h) => h.completed).length;
  const totalHabits = todayHabits.length || 5;

  const covenantDays = progress?.day40Progress || 0;
  const streakDays = progress?.streakDays || 0;
  const totalIstighfar = weekData.reduce((s, d) => s + d.istighfar, 0);
  const avgHabits = weekData.length > 0
    ? Math.round((weekData.reduce((s, d) => s + (d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0), 0) / weekData.length) * 100)
    : 0;

  const maxIstighfar = Math.max(...weekData.map((d) => d.istighfar), 1);

  const dayRates = weekData.map(d => d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0);
  const lastHalf = dayRates.slice(3);
  const firstHalf = dayRates.slice(0, 3);
  const lastAvg = lastHalf.length ? lastHalf.reduce((s, r) => s + r, 0) / lastHalf.length : 0;
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length : 0;
  const trendUp = lastAvg > firstAvg + 0.05;
  const trendDown = lastAvg < firstAvg - 0.05;

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-display font-bold mb-1">خريطة التقدم الروحي</h1>
        <p className="text-sm text-muted-foreground italic">"{quote}"</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: <Flame size={20} />, value: streakDays, label: "أيام متواصلة", color: "text-orange-500", bg: "bg-orange-500/10" },
          { icon: <TrendingUp size={20} />, value: `${covenantDays}/40`, label: "يوم في الخطة", color: "text-primary", bg: "bg-primary/10" },
          { icon: <CheckCircle2 size={20} />, value: `${completedToday}/${totalHabits}`, label: "عادات اليوم", color: "text-green-500", bg: "bg-green-500/10" },
          { icon: <Star size={20} />, value: `${avgHabits}%`, label: "معدل الأسبوع", color: "text-yellow-500", bg: "bg-yellow-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <BadgesSection />

      {sosStats.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-rose-500/10 border border-rose-400/30 rounded-xl p-4 mb-5 flex items-center gap-3"
        >
          <ShieldAlert size={20} className="text-rose-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
              استخدمت زر الطوارئ {sosStats.count} {sosStats.count === 1 ? "مرة" : "مرات"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              طلبت الله في لحظة صعبة — هذا جهاد حقيقي
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-4 mb-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-primary" />
          <h2 className="font-bold text-sm">نسبة إتمام العادات - آخر 7 أيام</h2>
          <div className="mr-auto flex items-center gap-1">
            {trendUp && <TrendingUp size={13} className="text-emerald-500" />}
            {trendDown && <TrendingDown size={13} className="text-rose-500" />}
            <span className={`text-[10px] font-bold ${trendUp ? "text-emerald-500" : trendDown ? "text-rose-500" : "text-muted-foreground"}`}>
              {trendUp ? "في تحسّن" : trendDown ? "تراجع طفيف" : "مستقر"}
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekData.map((day, i) => {
            const pct = day.habitsTotal > 0 ? (day.habitsCompleted / day.habitsTotal) : 0;
            const height = Math.max(pct * 100, 4);
            const today = isToday(day.date);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex-1 flex items-end w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-t-md ${today ? "bg-primary" : pct >= 0.8 ? "bg-green-500/70" : pct >= 0.4 ? "bg-yellow-500/70" : "bg-muted"}`}
                    style={{ minHeight: "4px" }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                  {getDayName(day.date)!.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-xl border border-border p-4 mb-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-secondary" />
          <h2 className="font-bold text-sm">الاستغفار - آخر 7 أيام</h2>
          <span className="mr-auto text-xs text-muted-foreground">الإجمالي: {totalIstighfar}</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-24">
          {weekData.map((day, i) => {
            const pct = day.istighfar / maxIstighfar;
            const height = Math.max(pct * 100, 4);
            const today = isToday(day.date);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex-1 flex items-end w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-t-md ${today ? "bg-secondary" : "bg-secondary/50"}`}
                    style={{ minHeight: "4px" }}
                  />
                </div>
                <span className={`text-[10px] ${today ? "text-secondary font-bold" : "text-muted-foreground"}`}>
                  {day.istighfar > 0 ? day.istighfar : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <SmartInsights weekData={weekData} streakDays={streakDays} sosCount={sosStats.count} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl border border-border p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className="text-primary" />
          <h2 className="font-bold text-sm">خطة الـ 40 يوماً</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 40 }, (_, i) => {
            const day = i + 1;
            const done = day <= covenantDays;
            const current = day === covenantDays + 1;
            return (
              <motion.div
                key={day}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.01 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  done ? "bg-primary text-primary-foreground" : current ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {covenantDays >= 40
            ? "مبارك! أكملت خطة الـ 40 يوماً 🎉"
            : `تبقّى ${40 - covenantDays} يوماً لإتمام الخطة`}
        </p>
      </motion.div>
    </div>
  );
}
