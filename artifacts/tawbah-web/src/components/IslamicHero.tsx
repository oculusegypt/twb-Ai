import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TimePeriod =
  | "tahajjud"
  | "fajr"
  | "ishraq"
  | "duha"
  | "zuhr"
  | "asr"
  | "maghrib"
  | "isha";

interface PeriodConfig {
  label: string;
  sublabel: string;
  greeting: string;
  sub: string;
  skyTop: string;
  skyBottom: string;
  accentColor: string;
  textColor: string;
  sunColor: string;
  sunGlow: string;
  starOpacity: number;
  sunY: number;
  patternOpacity: number;
  patternColor: string;
  content: ContentItem[];
}

interface ContentItem {
  type: "ayah" | "hadith" | "dua" | "wisdom" | "nafl";
  text: string;
  source?: string;
}

const PERIOD_CONFIGS: Record<TimePeriod, PeriodConfig> = {
  tahajjud: {
    label: "تهجُّد",
    sublabel: "الثلث الأخير من الليل",
    greeting: "الله يُنادي — فهل أنت تلبّي؟",
    sub: "ينزل ربنا كل ليلة في هذا الوقت يقول: من يدعوني فأستجيب له",
    skyTop: "#0a0520",
    skyBottom: "#1a0a3a",
    accentColor: "#7c3aed",
    textColor: "#e9d5ff",
    sunColor: "#fbbf24",
    sunGlow: "rgba(251,191,36,0.12)",
    starOpacity: 1,
    sunY: 95,
    patternOpacity: 0.12,
    patternColor: "#7c3aed",
    content: [
      { type: "ayah", text: "﴿وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ﴾", source: "الإسراء: 79" },
      { type: "hadith", text: "«يَنزِلُ ربُّنا تبارك وتعالى كلَّ ليلةٍ إلى السماءِ الدنيا حين يبقى ثلُثُ الليلِ الآخِر»", source: "متفق عليه" },
      { type: "dua", text: "«اللهم لك الحمد أنت نور السموات والأرض ومن فيهن، ولك الحمد أنت قيّوم السموات والأرض»", source: "دعاء قيام الليل" },
    ],
  },
  fajr: {
    label: "الفجر",
    sublabel: "وقت النور الأول",
    greeting: "نور الفجر يطلع — وقلبك يطلب الله",
    sub: "﴿وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾",
    skyTop: "#1e1035",
    skyBottom: "#4a1d73",
    accentColor: "#a855f7",
    textColor: "#f3e8ff",
    sunColor: "#fbbf24",
    sunGlow: "rgba(251,191,36,0.18)",
    starOpacity: 0.6,
    sunY: 85,
    patternOpacity: 0.14,
    patternColor: "#a855f7",
    content: [
      { type: "ayah", text: "﴿أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ﴾", source: "الإسراء: 78" },
      { type: "hadith", text: "«ركعتا الفجرِ خيرٌ من الدنيا وما فيها»", source: "رواه مسلم" },
      { type: "wisdom", text: "من صلّى الفجرَ في جماعةٍ فكأنما قام الليلَ كلَّه — ابدأ يومك بالله يُتِمَّ الله عليك يومك.", source: "" },
    ],
  },
  ishraq: {
    label: "الإشراق",
    sublabel: "شروق الشمس",
    greeting: "الشمس تشرق وأعمالك تُرفَع 🌅",
    sub: "من صلّى الفجرَ ثم جلس يذكر الله حتى تطلع الشمس كان له أجرُ حجةٍ وعُمرة",
    skyTop: "#7c2d12",
    skyBottom: "#ea580c",
    accentColor: "#f97316",
    textColor: "#fff7ed",
    sunColor: "#fbbf24",
    sunGlow: "rgba(251,191,36,0.35)",
    starOpacity: 0.05,
    sunY: 65,
    patternOpacity: 0.13,
    patternColor: "#f97316",
    content: [
      { type: "nafl", text: "صلاة الإشراق — ركعتان بعد طلوع الشمس بربع ساعة. أجرُها كحجةٍ وعُمرة كاملة.", source: "رواه الترمذي" },
      { type: "ayah", text: "﴿فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ﴾", source: "الروم: 17" },
      { type: "dua", text: "«اللهم إني أسألك علمًا نافعًا ورزقًا طيبًا وعملًا متقبَّلًا»", source: "دعاء الصباح" },
    ],
  },
  duha: {
    label: "الضُّحى",
    sublabel: "وقت الضحى المبارك",
    greeting: "الضحى وقتٌ للعطاء والذكر ☀️",
    sub: "تسبيحة في الضحى خيرٌ لك من الدنيا وما فيها",
    skyTop: "#1d4ed8",
    skyBottom: "#60a5fa",
    accentColor: "#f59e0b",
    textColor: "#fefce8",
    sunColor: "#fde047",
    sunGlow: "rgba(253,224,71,0.4)",
    starOpacity: 0,
    sunY: 30,
    patternOpacity: 0.1,
    patternColor: "#f59e0b",
    content: [
      { type: "nafl", text: "صلاة الضحى — تُصلَّى من بعد شروق الشمس بربع ساعة إلى قُبيل الظهر. من 2 إلى 12 ركعة.", source: "" },
      { type: "ayah", text: "﴿وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ ۝ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾", source: "الضحى: 1-3" },
      { type: "hadith", text: "«يُصبِحُ على كلِّ سُلامى مِن أحدِكم صدقة، فكلُّ تسبيحةٍ صدقة، وكلُّ تحميدةٍ صدقة»", source: "رواه مسلم" },
    ],
  },
  zuhr: {
    label: "الظهر",
    sublabel: "منتصف النهار",
    greeting: "طاب ظهرك بطاعة الله 🕌",
    sub: "استمر — الله يرى مجاهدتك ويُعظِّم أجرك",
    skyTop: "#0c4a6e",
    skyBottom: "#0ea5e9",
    accentColor: "#0ea5e9",
    textColor: "#f0f9ff",
    sunColor: "#fde68a",
    sunGlow: "rgba(253,230,138,0.45)",
    starOpacity: 0,
    sunY: 15,
    patternOpacity: 0.09,
    patternColor: "#0ea5e9",
    content: [
      { type: "ayah", text: "﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا﴾", source: "النساء: 103" },
      { type: "hadith", text: "«من صلّى البَردَيْن دخلَ الجنةَ» — الفجر والعصر", source: "متفق عليه" },
      { type: "wisdom", text: "وقت الظهر فيه ساعة مباركة للدعاء — لا تتركها تمرّ دون أن ترفع يديك إلى الله.", source: "" },
    ],
  },
  asr: {
    label: "العصر",
    sublabel: "وقت العصر الشريف",
    greeting: "العصر — صلاةٌ يراها الملائكة 🌤️",
    sub: "﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾",
    skyTop: "#78350f",
    skyBottom: "#d97706",
    accentColor: "#d97706",
    textColor: "#fffbeb",
    sunColor: "#fbbf24",
    sunGlow: "rgba(251,191,36,0.3)",
    starOpacity: 0,
    sunY: 55,
    patternOpacity: 0.12,
    patternColor: "#d97706",
    content: [
      { type: "ayah", text: "﴿وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ﴾", source: "العصر: 1-3" },
      { type: "hadith", text: "«من فاتَتْه صلاةُ العصرِ فكأنما وُتِرَ أهلَه ومالَه»", source: "متفق عليه" },
      { type: "dua", text: "«اللهم إني أعوذ بك من الهمّ والحزن، وأعوذ بك من العجز والكسل، وأعوذ بك من الجبن والبخل»", source: "دعاء المساء" },
    ],
  },
  maghrib: {
    label: "المغرب",
    sublabel: "غروب الشمس",
    greeting: "ساعة المغرب — ادعُ فالدعاء مُستجاب 🌇",
    sub: "بين الأذان والإقامة دعوةٌ لا تُرَدّ — اغتنمها الآن",
    skyTop: "#4c1d95",
    skyBottom: "#b45309",
    accentColor: "#dc2626",
    textColor: "#fef2f2",
    sunColor: "#fb923c",
    sunGlow: "rgba(251,146,60,0.35)",
    starOpacity: 0.2,
    sunY: 80,
    patternOpacity: 0.13,
    patternColor: "#dc2626",
    content: [
      { type: "hadith", text: "«الدعاءُ لا يُرَدُّ بين الأذانِ والإقامة»", source: "رواه الترمذي" },
      { type: "ayah", text: "﴿فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ ۝ وَلَهُ الْحَمْدُ فِي السَّمَاوَاتِ وَالْأَرْضِ﴾", source: "الروم: 17-18" },
      { type: "dua", text: "«أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير»", source: "أذكار المساء" },
    ],
  },
  isha: {
    label: "العشاء",
    sublabel: "الليل يبدأ",
    greeting: "الله يثبّتك في ليلتك 🌙",
    sub: "صلاة العشاء في جماعة كقيام نصف الليل — لا تفرّط",
    skyTop: "#0f172a",
    skyBottom: "#1e1b4b",
    accentColor: "#6366f1",
    textColor: "#e0e7ff",
    sunColor: "#fbbf24",
    sunGlow: "rgba(251,191,36,0.08)",
    starOpacity: 0.9,
    sunY: 110,
    patternOpacity: 0.11,
    patternColor: "#6366f1",
    content: [
      { type: "hadith", text: "«من صلّى العشاءَ في جماعةٍ فكأنما قام نصفَ الليل»", source: "رواه مسلم" },
      { type: "nafl", text: "الوترُ — أوصى به النبيُّ ﷺ كلَّ من يُريد النوم. ركعةٌ واحدةٌ تُختَم بها ليلتك.", source: "" },
      { type: "ayah", text: "﴿وَمِنَ اللَّيْلِ فَسَبِّحْهُ وَأَدْبَارَ السُّجُودِ﴾", source: "ق: 40" },
    ],
  },
};

function getTimePeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h >= 0 && h < 4) return "tahajjud";
  if (h >= 4 && h < 6) return "fajr";
  if (h >= 6 && h < 8) return "ishraq";
  if (h >= 8 && h < 12) return "duha";
  if (h >= 12 && h < 15) return "zuhr";
  if (h >= 15 && h < 18) return "asr";
  if (h >= 18 && h < 20) return "maghrib";
  return "isha";
}

function getDayProgress(): number {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, Math.min(1, (mins - 240) / (24 * 60 - 240)));
}

function Star({ cx, cy, r, opacity }: { cx: number; cy: number; r: number; opacity: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />;
}

function IslamicStarPattern({
  x, y, size, color, opacity, rotate = 0,
}: { x: number; y: number; size: number; color: string; opacity: number; rotate?: number }) {
  const s = size / 2;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const outerR = s;
    const innerR = s * 0.42;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <g transform={`rotate(${rotate} ${x} ${y})`} opacity={opacity}>
      <polygon points={pts} fill="none" stroke={color} strokeWidth={1.2} />
      <polygon
        points={Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45 - 90 + 22.5) * (Math.PI / 180);
          const r = s * 0.42;
          return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
        }).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={0.7}
        opacity={0.6}
      />
      <circle cx={x} cy={y} r={s * 0.15} fill={color} opacity={0.4} />
    </g>
  );
}

function GeometricGrid({ color, opacity }: { color: string; opacity: number }) {
  const stars = [
    { x: 10, y: 12, s: 60 },
    { x: 55, y: 12, s: 55 },
    { x: 82, y: 30, s: 45 },
    { x: 30, y: 40, s: 50 },
    { x: 70, y: 65, s: 60 },
    { x: 15, y: 72, s: 48 },
    { x: 50, y: 85, s: 55 },
    { x: 88, y: 88, s: 44 },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      {stars.map((s, i) => (
        <IslamicStarPattern
          key={i}
          x={s.x}
          y={s.y}
          size={s.s * 0.28}
          color={color}
          opacity={0.7 + (i % 3) * 0.1}
          rotate={i * 7}
        />
      ))}
      {/* Connecting lines - arabesque feel */}
      <path
        d="M 10 12 Q 30 25 55 12 Q 70 18 82 30 Q 75 47 70 65 Q 58 75 50 85 Q 32 80 15 72 Q 5 55 10 40 Q 18 26 10 12"
        fill="none"
        stroke={color}
        strokeWidth={0.4}
        opacity={0.35}
      />
      <path
        d="M 55 12 Q 70 30 70 65 Q 55 90 15 72 Q 5 42 30 40 Q 45 20 55 12"
        fill="none"
        stroke={color}
        strokeWidth={0.3}
        opacity={0.2}
      />
    </svg>
  );
}

function MandalaPattern({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      {/* Center mandala */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = 100 + 35 * Math.cos(angle);
        const y = 100 + 35 * Math.sin(angle);
        return (
          <g key={i}>
            <IslamicStarPattern x={x} y={y} size={22} color={color} opacity={0.6} rotate={i * 15} />
            <line
              x1={100}
              y1={100}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={0.4}
              opacity={0.25}
            />
          </g>
        );
      })}
      <IslamicStarPattern x={100} y={100} size={32} color={color} opacity={0.9} rotate={0} />

      {/* Corner patterns */}
      <IslamicStarPattern x={20} y={20} size={28} color={color} opacity={0.5} rotate={15} />
      <IslamicStarPattern x={180} y={20} size={28} color={color} opacity={0.5} rotate={-15} />
      <IslamicStarPattern x={20} y={180} size={28} color={color} opacity={0.5} rotate={-15} />
      <IslamicStarPattern x={180} y={180} size={28} color={color} opacity={0.5} rotate={15} />
    </svg>
  );
}

function NightPattern({ color, opacity }: { color: string; opacity: number }) {
  const starsData = [
    { cx: 15, cy: 10, r: 0.8 }, { cx: 42, cy: 8, r: 0.5 }, { cx: 68, cy: 15, r: 0.7 },
    { cx: 88, cy: 6, r: 0.6 }, { cx: 25, cy: 25, r: 0.4 }, { cx: 78, cy: 30, r: 0.8 },
    { cx: 5, cy: 45, r: 0.5 }, { cx: 55, cy: 35, r: 0.7 }, { cx: 92, cy: 50, r: 0.4 },
    { cx: 33, cy: 55, r: 0.6 }, { cx: 72, cy: 58, r: 0.5 }, { cx: 18, cy: 70, r: 0.8 },
    { cx: 60, cy: 72, r: 0.6 }, { cx: 90, cy: 78, r: 0.5 }, { cx: 45, cy: 80, r: 0.7 },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      {starsData.map((s, i) => (
        <Star key={i} {...s} opacity={0.6 + (i % 4) * 0.1} />
      ))}
      <IslamicStarPattern x={50} y={50} size={30} color={color} opacity={0.7} rotate={0} />
      <IslamicStarPattern x={15} y={20} size={18} color={color} opacity={0.5} rotate={20} />
      <IslamicStarPattern x={80} y={25} size={16} color={color} opacity={0.45} rotate={-10} />
      <IslamicStarPattern x={20} y={80} size={20} color={color} opacity={0.5} rotate={5} />
      <IslamicStarPattern x={85} y={75} size={18} color={color} opacity={0.45} rotate={-20} />
    </svg>
  );
}

function SunArc({ progress, sunColor, sunGlow }: { progress: number; sunColor: string; sunGlow: string }) {
  const arcPath = "M 8,85 Q 50,10 92,85";
  const pathLength = 200;
  const sunProgress = Math.min(progress, 0.98);
  const t = sunProgress;
  const sunX = 8 + (2 * (1 - t) * t * (50 - 8) + t * t * (92 - 8));
  const controlY = 10;
  const sunY = 85 + 2 * t * (1 - t) * (controlY - 85) + t * t * (controlY - 85) + t * (85 - 85);
  const quadY = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * controlY + t * t * 85;

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <filter id="sunGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.6"
        strokeDasharray="2,2"
      />
      {progress < 1 && (
        <>
          <circle
            cx={sunX}
            cy={quadY}
            r="5"
            fill={sunGlow}
            filter="url(#sunGlow)"
          />
          <circle cx={sunX} cy={quadY} r="2.8" fill={sunColor} opacity={0.95} />
          <circle cx={sunX} cy={quadY} r="1.4" fill="white" opacity={0.7} />
        </>
      )}
    </svg>
  );
}

export function IslamicHero() {
  const [period, setPeriod] = useState<TimePeriod>(getTimePeriod);
  const [contentIdx, setContentIdx] = useState(0);
  const [dayProgress, setDayProgress] = useState(getDayProgress());
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => {
      setPeriod(getTimePeriod());
      setDayProgress(getDayProgress());
      setTick((t) => t + 1);
    };
    intervalRef.current = setInterval(update, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const slotIdx = Math.floor(Date.now() / (20 * 60 * 1000));
    const cfg = PERIOD_CONFIGS[period];
    setContentIdx(slotIdx % cfg.content.length);
  }, [period, tick]);

  const cfg = PERIOD_CONFIGS[period];
  const content = cfg.content[contentIdx];
  const isNight = period === "isha" || period === "tahajjud" || period === "fajr";

  const typeLabel: Record<ContentItem["type"], string> = {
    ayah: "آية كريمة",
    hadith: "حديث شريف",
    dua: "دعاء مأثور",
    wisdom: "نصيحة",
    nafl: "تذكير",
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 264 }}>
      {/* Animated sky gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8 }}
          style={{
            background: `linear-gradient(to bottom, ${cfg.skyTop}, ${cfg.skyBottom})`,
          }}
        />
      </AnimatePresence>

      {/* Islamic geometric pattern — changes with period */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-pattern"}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.97, rotate: -1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.03, rotate: 1 }}
          transition={{ duration: 1.4 }}
        >
          {isNight ? (
            <NightPattern color={cfg.patternColor} opacity={cfg.patternOpacity} />
          ) : (period === "ishraq" || period === "maghrib") ? (
            <GeometricGrid color={cfg.patternColor} opacity={cfg.patternOpacity} />
          ) : (
            <MandalaPattern color={cfg.patternColor} opacity={cfg.patternOpacity} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sun arc progress */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-sun"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <SunArc progress={dayProgress} sunColor={cfg.sunColor} sunGlow={cfg.sunGlow} />
        </motion.div>
      </AnimatePresence>

      {/* Bottom fade to page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--background, #fff) 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8">
        {/* Period badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period + "-badge"}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-2"
          >
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${cfg.accentColor}22`,
                borderColor: `${cfg.accentColor}55`,
                color: cfg.textColor,
              }}
            >
              {cfg.label} — {cfg.sublabel}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Greeting */}
        <AnimatePresence mode="wait">
          <motion.p
            key={period + "-greeting"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-sm font-bold leading-snug mb-1 drop-shadow-md"
            style={{ color: cfg.textColor }}
          >
            {cfg.greeting}
          </motion.p>
        </AnimatePresence>

        {/* Dynamic Islamic content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period + "-content-" + contentIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border px-3 py-2.5"
            style={{
              backgroundColor: `${cfg.skyTop}bb`,
              borderColor: `${cfg.accentColor}40`,
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setContentIdx((i) => (i + 1) % cfg.content.length)}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${cfg.accentColor}33`,
                  color: cfg.accentColor,
                  filter: "brightness(1.8)",
                }}
              >
                {typeLabel[content.type]}
              </span>
              {content.source && (
                <span className="text-[9px]" style={{ color: `${cfg.textColor}70` }}>
                  {content.source}
                </span>
              )}
              <span
                className="text-[9px] mr-auto opacity-50"
                style={{ color: cfg.textColor }}
              >
                اضغط للتالي ›
              </span>
            </div>
            <p
              className="text-[11px] leading-relaxed font-medium"
              style={{ color: cfg.textColor }}
              dir="rtl"
            >
              {content.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
