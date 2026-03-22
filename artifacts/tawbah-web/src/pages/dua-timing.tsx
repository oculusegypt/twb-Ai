import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Moon, Sun, Clock, Star, Heart, Droplets, BookOpen, Wind } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface DuaWindow {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  iconBg: string;
  glowColor: string;
  isActive: boolean;
  alwaysActive?: boolean;
  power: number;
  hadith?: string;
}

function getDayOfWeek() {
  return new Date().getDay();
}

function getHour() {
  return new Date().getHours();
}

function isLastThirdOfNight(): boolean {
  const h = getHour();
  return h >= 2 && h <= 5;
}

function isFajrTime(): boolean {
  const h = getHour();
  return h >= 4 && h <= 5;
}

function isMorningDhikrTime(): boolean {
  const h = getHour();
  return h >= 5 && h <= 7;
}

function isEveningDhikrTime(): boolean {
  const h = getHour();
  return h >= 17 && h <= 19;
}

function isFriday(): boolean {
  return getDayOfWeek() === 5;
}

function isFridayAnswerHour(): boolean {
  const h = getHour();
  return isFriday() && h >= 15 && h <= 17;
}

function isBetweenAdhanIqamah(): boolean {
  const h = getHour();
  const m = new Date().getMinutes();
  const isNearPrayer =
    (h === 5 && m >= 0 && m <= 20) ||
    (h === 12 && m >= 0 && m <= 20) ||
    (h === 15 && m >= 30 && m <= 50) ||
    (h === 18 && m >= 0 && m <= 20) ||
    (h === 19 && m >= 30 && m <= 50);
  return isNearPrayer;
}

function isMonThur(): boolean {
  const d = getDayOfWeek();
  return d === 1 || d === 4;
}

function getHijriDay(): number {
  const now = new Date();
  const jd = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor(50 * l2 / 17719) + Math.floor(l2 / 5670) * Math.floor(43 * l2 / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const day = Math.floor(24 * l3 / 709);
  return day;
}

function getHijriMonth(): number {
  const now = new Date();
  const jd = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor(50 * l2 / 17719) + Math.floor(l2 / 5670) * Math.floor(43 * l2 / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const month = Math.floor(l3 / 29.5001) + 1;
  return month;
}

function isArafahDay(): boolean {
  return getHijriMonth() === 12 && getHijriDay() === 9;
}

function isRamadan(): boolean {
  return getHijriMonth() === 9;
}

function calcPowerScore(windows: DuaWindow[]): number {
  const active = windows.filter((w) => w.isActive || w.alwaysActive);
  if (active.length === 0) return 12;
  const total = active.reduce((s, w) => s + w.power, 0);
  return Math.min(100, total);
}

function getPowerLabel(score: number): { label: string; color: string; pulse: boolean } {
  if (score >= 80) return { label: "قمة الإجابة ✨", color: "text-yellow-500", pulse: true };
  if (score >= 60) return { label: "لحظة قوية جداً", color: "text-amber-500", pulse: true };
  if (score >= 40) return { label: "وقت مبارك", color: "text-emerald-500", pulse: false };
  if (score >= 25) return { label: "دعاء مستحب", color: "text-blue-500", pulse: false };
  return { label: "استعد للحظة القادمة", color: "text-muted-foreground", pulse: false };
}

function getNextPeakDescription(score: number): string {
  if (score >= 60) return "أنت الآن في لحظة مباركة — ارفع يديك وادعُ";
  const h = getHour();
  if (h < 3) return "السدس الأخير من الليل يبدأ قريباً (2-5 صباحاً)";
  if (h < 5) return "صلاة الفجر على وشك الأذان — ادعُ بين الأذان والإقامة";
  if (h < 12) return "أجمل وقت لصلاة الضحى وقراءة الأوراد الصباحية";
  if (h < 14) return "الصلاة على النبي ﷺ يوم الجمعة تضاعف الأجر";
  if (h < 15) return "اقتربت ساعة الإجابة الجمعة (3-5 عصراً)";
  if (h < 17) return "أذكار العصر والدعاء قبيل المغرب";
  return "قُم في آخر الليل لصلاة ركعتين وادعُ";
}

export default function DuaTiming() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const windows: DuaWindow[] = [
    {
      id: "last-third",
      label: "آخر ثلث الليل",
      sub: "ينزل الله إلى السماء الدنيا",
      icon: <Moon size={20} />,
      color: "text-indigo-400",
      border: "border-indigo-400/30",
      iconBg: "bg-indigo-500/15",
      glowColor: "shadow-indigo-500/30",
      isActive: isLastThirdOfNight(),
      power: 40,
      hadith: "«ينزل ربنا كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر فيقول: من يدعوني فأستجيب له»",
    },
    {
      id: "friday-hour",
      label: "ساعة الإجابة — الجمعة",
      sub: "آخر ساعة قبل المغرب جمعة",
      icon: <Star size={20} />,
      color: "text-yellow-500",
      border: "border-yellow-400/30",
      iconBg: "bg-yellow-500/15",
      glowColor: "shadow-yellow-500/30",
      isActive: isFridayAnswerHour(),
      power: 45,
      hadith: "«فيه ساعة لا يوافقها عبد مسلم وهو قائم يصلي يسأل الله شيئاً إلا أعطاه إياه»",
    },
    {
      id: "adhan-iqamah",
      label: "بين الأذان والإقامة",
      sub: "لا يُرد الدعاء في هذا الوقت",
      icon: <Wind size={20} />,
      color: "text-emerald-500",
      border: "border-emerald-400/30",
      iconBg: "bg-emerald-500/15",
      glowColor: "shadow-emerald-500/30",
      isActive: isBetweenAdhanIqamah(),
      power: 35,
      hadith: "«الدعاء لا يُرد بين الأذان والإقامة»",
    },
    {
      id: "fajr-time",
      label: "وقت الفجر",
      sub: "صلِّ ركعتين قبل الفريضة وادعُ",
      icon: <Sun size={20} />,
      color: "text-amber-400",
      border: "border-amber-400/30",
      iconBg: "bg-amber-400/15",
      glowColor: "shadow-amber-400/30",
      isActive: isFajrTime(),
      power: 30,
      hadith: "«ركعتا الفجر خير من الدنيا وما فيها» — ومن صلاهما وجد قلبه خفيفاً مفتوحاً للدعاء",
    },
    {
      id: "morning-adhkar",
      label: "أذكار الصباح",
      sub: "بعد الفجر إلى الشروق",
      icon: <Sun size={20} />,
      color: "text-orange-400",
      border: "border-orange-400/30",
      iconBg: "bg-orange-400/15",
      glowColor: "shadow-orange-400/30",
      isActive: isMorningDhikrTime(),
      power: 25,
      hadith: "«من صلى الفجر في جماعة ثم قعد يذكر الله حتى تطلع الشمس كانت له كأجر حجة وعمرة تامة تامة تامة»",
    },
    {
      id: "evening-adhkar",
      label: "أذكار المساء",
      sub: "من العصر إلى المغرب",
      icon: <Moon size={20} />,
      color: "text-purple-400",
      border: "border-purple-400/30",
      iconBg: "bg-purple-400/15",
      glowColor: "shadow-purple-400/30",
      isActive: isEveningDhikrTime(),
      power: 25,
      hadith: "«من قرأ آية الكرسي حين يمسي أُجير من الجن حتى يصبح»",
    },
    {
      id: "mon-thur",
      label: "الاثنين والخميس",
      sub: "تُعرض الأعمال على الله",
      icon: <BookOpen size={20} />,
      color: "text-teal-500",
      border: "border-teal-400/30",
      iconBg: "bg-teal-500/15",
      glowColor: "shadow-teal-500/30",
      isActive: isMonThur(),
      power: 20,
      hadith: "«تُعرض الأعمال يوم الاثنين والخميس، فأحب أن يُعرض عملي وأنا صائم»",
    },
    {
      id: "arafa",
      label: "يوم عرفة",
      sub: "أعظم يوم في السنة",
      icon: <Star size={20} />,
      color: "text-yellow-600",
      border: "border-yellow-500/30",
      iconBg: "bg-yellow-600/15",
      glowColor: "shadow-yellow-600/30",
      isActive: isArafahDay(),
      power: 50,
      hadith: "«خير الدعاء دعاء يوم عرفة»",
    },
    {
      id: "ramadan",
      label: "رمضان المبارك",
      sub: "شهر الرحمة والمغفرة والدعاء",
      icon: <Moon size={20} />,
      color: "text-violet-500",
      border: "border-violet-400/30",
      iconBg: "bg-violet-500/15",
      glowColor: "shadow-violet-500/30",
      isActive: isRamadan(),
      power: 30,
      hadith: "«في كل ليلة من رمضان عتقاء من النار» — وللصائم عند فطره دعوة لا تُرد",
    },
    {
      id: "sujood",
      label: "في السجود",
      sub: "أقرب ما يكون العبد من ربه",
      icon: <Heart size={20} />,
      color: "text-rose-500",
      border: "border-rose-400/30",
      iconBg: "bg-rose-500/15",
      glowColor: "shadow-rose-500/30",
      isActive: false,
      alwaysActive: true,
      power: 35,
      hadith: "«أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء»",
    },
    {
      id: "rain",
      label: "عند نزول المطر",
      sub: "لحظة استجابة مباركة",
      icon: <Droplets size={20} />,
      color: "text-sky-500",
      border: "border-sky-400/30",
      iconBg: "bg-sky-500/15",
      glowColor: "shadow-sky-500/30",
      isActive: false,
      alwaysActive: false,
      power: 30,
      hadith: "«ثنتان لا تُردان: الدعاء عند النداء (الأذان) وتحت المطر»",
    },
  ];

  const power = calcPowerScore(windows);
  const powerInfo = getPowerLabel(power);
  const activeWindows = windows.filter((w) => w.isActive || w.alwaysActive);
  const inactiveWindows = windows.filter((w) => !w.isActive && !w.alwaysActive);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const barColor =
    power >= 80 ? "from-yellow-400 to-amber-500" :
    power >= 60 ? "from-amber-400 to-orange-500" :
    power >= 40 ? "from-emerald-400 to-teal-500" :
    power >= 25 ? "from-blue-400 to-indigo-500" :
    "from-slate-400 to-slate-500";

  return (
    <div className="flex flex-col flex-1 pb-24">
      <PageHeader title="لحظة الإجابة" subtitle="أوقات إجابة الدعاء الآن" icon={<Clock size={16} />} />

      <div className="px-4 pt-5 space-y-5">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-border/30 bg-gradient-to-br from-card to-card/50 p-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">قوة الدعاء الآن</p>
              <p className={`text-lg font-bold ${powerInfo.color} flex items-center gap-1.5`}>
                {powerInfo.pulse && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${power >= 60 ? "bg-yellow-400" : "bg-emerald-400"} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${power >= 60 ? "bg-yellow-500" : "bg-emerald-500"}`} />
                  </span>
                )}
                {powerInfo.label}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-primary/10" />
                <motion.circle
                  cx="32" cy="32" r="26" fill="none" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - power / 100)}`}
                  strokeLinecap="round"
                  className={`text-yellow-500`}
                  style={{ stroke: power >= 80 ? "#eab308" : power >= 60 ? "#f59e0b" : power >= 40 ? "#10b981" : power >= 25 ? "#3b82f6" : "#94a3b8" }}
                  initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - power / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{power}%</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden mb-3">
            <motion.div
              className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${power}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {getNextPeakDescription(power)}
          </p>
        </motion.div>

        {activeWindows.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" />
              نوافذ الإجابة النشطة الآن
            </h2>
            <div className="space-y-2.5">
              <AnimatePresence>
                {activeWindows.map((w, i) => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                      className={`w-full text-right rounded-2xl border ${w.border} bg-gradient-to-l from-card/80 to-card p-4 shadow-sm ${w.glowColor} ${w.isActive ? "shadow-md" : "shadow-sm"} transition-all active:scale-[0.98]`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${w.iconBg} flex items-center justify-center shrink-0 ${w.color}`}>
                          {w.icon}
                        </div>
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-sm ${w.color}`}>{w.label}</h3>
                            {w.alwaysActive && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">دائماً</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{w.sub}</p>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${w.iconBg} ${w.color}`}>
                          +{w.power}%
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedId === w.id && w.hadith && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-border/30"
                          >
                            <p className="text-xs text-muted-foreground leading-relaxed italic">{w.hadith}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {inactiveWindows.filter(w => !w.alwaysActive).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
              <Clock size={14} />
              نوافذ إجابة أخرى
            </h2>
            <div className="space-y-2">
              {inactiveWindows.filter(w => !w.alwaysActive).map((w, i) => (
                <motion.button
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  className="w-full text-right rounded-2xl border border-border/30 bg-card/50 p-3.5 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 text-muted-foreground">
                      {w.icon}
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-semibold text-sm text-muted-foreground">{w.label}</h3>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{w.sub}</p>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedId === w.id && w.hadith && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/30"
                      >
                        <p className="text-xs text-muted-foreground leading-relaxed italic">{w.hadith}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-l from-yellow-500/10 to-amber-400/5 p-4">
          <h3 className="font-bold text-sm text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
            <Star size={14} />
            دعاء مستحب الآن
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 font-arabic">
            «اللهم إني أسألك رحمةً من عندك تهدي بها قلبي، وتجمع بها أمري، وتُصلح بها شأني»
          </p>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/50 p-4">
          <h3 className="font-bold text-sm mb-3">آداب الدعاء</h3>
          <div className="space-y-2">
            {[
              { t: "ابدأ بالحمد والصلاة على النبي ﷺ", c: "text-amber-600" },
              { t: "استقبل القبلة وارفع يديك", c: "text-emerald-600" },
              { t: "ادعُ بيقين وحضور قلب", c: "text-blue-600" },
              { t: "كرّر الدعاء ثلاثاً", c: "text-violet-600" },
              { t: "اختم بالصلاة على النبي ﷺ والتأمين", c: "text-rose-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${item.c.replace("text-", "bg-")} shrink-0`} />
                <p className="text-xs text-muted-foreground">{item.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
