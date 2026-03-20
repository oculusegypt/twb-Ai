import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, MessageCircle, Star, Moon, Sun } from "lucide-react";

// ── Time period ───────────────────────────────────────────────────────────────

type TimePeriod =
  | "tahajjud" | "fajr" | "ishraq" | "duha"
  | "zuhr" | "asr" | "maghrib" | "isha";

interface PeriodConfig {
  label: string;
  sublabel: string;
  skyTop: string;
  skyBottom: string;
  accentColor: string;
  textColor: string;
  patternOpacity: number;
  patternColor: string;
  starOpacity: number;
}

const PERIOD_CONFIGS: Record<TimePeriod, PeriodConfig> = {
  tahajjud: {
    label: "تهجُّد", sublabel: "الثلث الأخير من الليل",
    skyTop: "#0a0520", skyBottom: "#1a0a3a",
    accentColor: "#7c3aed", textColor: "#e9d5ff",
    patternOpacity: 0.12, patternColor: "#7c3aed", starOpacity: 1,
  },
  fajr: {
    label: "الفجر", sublabel: "وقت النور الأول",
    skyTop: "#1e1035", skyBottom: "#4a1d73",
    accentColor: "#a855f7", textColor: "#f3e8ff",
    patternOpacity: 0.14, patternColor: "#a855f7", starOpacity: 0.5,
  },
  ishraq: {
    label: "الإشراق", sublabel: "شروق الشمس",
    skyTop: "#7c2d12", skyBottom: "#ea580c",
    accentColor: "#f97316", textColor: "#fff7ed",
    patternOpacity: 0.13, patternColor: "#f97316", starOpacity: 0,
  },
  duha: {
    label: "الضُّحى", sublabel: "وقت الضحى المبارك",
    skyTop: "#1d4ed8", skyBottom: "#60a5fa",
    accentColor: "#f59e0b", textColor: "#fefce8",
    patternOpacity: 0.10, patternColor: "#f59e0b", starOpacity: 0,
  },
  zuhr: {
    label: "الظهر", sublabel: "منتصف النهار",
    skyTop: "#0c4a6e", skyBottom: "#0ea5e9",
    accentColor: "#0ea5e9", textColor: "#f0f9ff",
    patternOpacity: 0.09, patternColor: "#0ea5e9", starOpacity: 0,
  },
  asr: {
    label: "العصر", sublabel: "وقت العصر الشريف",
    skyTop: "#78350f", skyBottom: "#d97706",
    accentColor: "#d97706", textColor: "#fffbeb",
    patternOpacity: 0.12, patternColor: "#d97706", starOpacity: 0,
  },
  maghrib: {
    label: "المغرب", sublabel: "غروب الشمس",
    skyTop: "#4c1d95", skyBottom: "#b45309",
    accentColor: "#dc2626", textColor: "#fef2f2",
    patternOpacity: 0.13, patternColor: "#dc2626", starOpacity: 0.2,
  },
  isha: {
    label: "العشاء", sublabel: "الليل يبدأ",
    skyTop: "#0f172a", skyBottom: "#1e1b4b",
    accentColor: "#6366f1", textColor: "#e0e7ff",
    patternOpacity: 0.11, patternColor: "#6366f1", starOpacity: 0.9,
  },
};

function getTimePeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h < 4)  return "tahajjud";
  if (h < 6)  return "fajr";
  if (h < 8)  return "ishraq";
  if (h < 12) return "duha";
  if (h < 13) return "zuhr";
  if (h < 16) return "asr";
  if (h < 19) return "maghrib";
  return "isha";
}

// ── Islamic star pattern ──────────────────────────────────────────────────────

function IslamicStarPattern({ x, y, size, color, opacity, rotate = 0 }: {
  x: number; y: number; size: number; color: string; opacity: number; rotate?: number;
}) {
  const s = size / 2;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? s : s * 0.42;
    return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`} opacity={opacity}>
      <polygon points={pts} fill="none" stroke={color} strokeWidth={1.2} />
      <circle cx={x} cy={y} r={s * 0.15} fill={color} opacity={0.4} />
    </g>
  );
}

function NightStars({ opacity }: { opacity: number }) {
  const stars = [
    { cx: 15, cy: 8, r: 0.8 }, { cx: 42, cy: 6, r: 0.5 }, { cx: 68, cy: 13, r: 0.7 },
    { cx: 88, cy: 5, r: 0.6 }, { cx: 25, cy: 22, r: 0.4 }, { cx: 78, cy: 28, r: 0.8 },
    { cx: 5, cy: 40, r: 0.5 }, { cx: 55, cy: 32, r: 0.7 }, { cx: 92, cy: 48, r: 0.4 },
  ];
  if (opacity === 0) return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none">
      {stars.map((s, i) => (
        <circle key={i} {...s} fill="white" opacity={opacity * (0.5 + (i % 3) * 0.15)} />
      ))}
    </svg>
  );
}

function PatternLayer({ color, opacity }: { color: string; opacity: number }) {
  const stars = [
    { x: 12, y: 14, s: 18, r: 0 },   { x: 55, y: 10, s: 16, r: 15 },
    { x: 85, y: 28, s: 14, r: -10 }, { x: 28, y: 42, s: 15, r: 5 },
    { x: 72, y: 62, s: 18, r: 20 },  { x: 18, y: 74, s: 14, r: -5 },
    { x: 90, y: 82, s: 13, r: 10 },  { x: 48, y: 88, s: 16, r: 0 },
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      {stars.map((s, i) => (
        <IslamicStarPattern key={i} x={s.x} y={s.y} size={s.s} color={color} opacity={opacity * (0.6 + (i % 3) * 0.13)} rotate={s.r} />
      ))}
      <path d="M 12 14 Q 30 28 55 10 Q 72 20 85 28 Q 78 45 72 62 Q 58 78 48 88 Q 32 82 18 74 Q 8 55 12 42 Q 20 28 12 14" fill="none" stroke={color} strokeWidth={0.4} opacity={opacity * 0.35} />
    </svg>
  );
}

// ── AI Content types ──────────────────────────────────────────────────────────

interface HeroItem {
  type: "ayah" | "hadith" | "dhikr" | "nafl" | "dua" | "wisdom";
  text: string;
  source?: string;
}

const TYPE_META: Record<HeroItem["type"], { label: string; icon: React.ReactNode; color: string }> = {
  ayah:    { label: "آية كريمة",       icon: <BookOpen size={10} />,    color: "#10b981" },
  hadith:  { label: "حديث شريف",       icon: <MessageCircle size={10} />, color: "#f59e0b" },
  dhikr:   { label: "ذكر مأثور",       icon: <Star size={10} />,        color: "#8b5cf6" },
  nafl:    { label: "نافلة وسنة",      icon: <Sun size={10} />,         color: "#0ea5e9" },
  dua:     { label: "دعاء مأثور",      icon: <Moon size={10} />,        color: "#a855f7" },
  wisdom:  { label: "نصيحة روحية",     icon: <Sparkles size={10} />,   color: "#f43f5e" },
};

const CACHE_KEY = "hero_content_cache";
const CACHE_TTL = 30 * 60 * 1000;

function loadCachedItems(): HeroItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, expiresAt } = JSON.parse(raw) as { items: HeroItem[]; expiresAt: number };
    if (Date.now() > expiresAt) return null;
    return items;
  } catch { return null; }
}

function saveCache(items: HeroItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, expiresAt: Date.now() + CACHE_TTL }));
  } catch { /* ignore */ }
}

// ── Main component ────────────────────────────────────────────────────────────

export function IslamicHero() {
  const [period, setPeriod] = useState<TimePeriod>(getTimePeriod);
  const [items, setItems] = useState<HeroItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchContent = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadCachedItems();
      if (cached) { setItems(cached); setLoading(false); return; }
    }
    try {
      const res = await fetch("/api/hero-content");
      if (!res.ok) throw new Error("failed");
      const data = await res.json() as { items: HeroItem[] };
      if (data.items?.length) {
        saveCache(data.items);
        setItems(data.items);
      }
    } catch { /* fallback to static */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchContent();
    const periodTimer = setInterval(() => setPeriod(getTimePeriod()), 60_000);
    return () => clearInterval(periodTimer);
  }, [fetchContent]);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 8000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  const cfg = PERIOD_CONFIGS[period];
  const item = items[idx] ?? null;
  const meta = item ? TYPE_META[item.type] : null;
  const isNight = period === "isha" || period === "tahajjud" || period === "fajr";

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: 280,
        maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
      }}
    >
      {/* Sky gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8 }}
          style={{ background: `linear-gradient(to bottom, ${cfg.skyTop}, ${cfg.skyBottom})` }}
        />
      </AnimatePresence>

      {/* Stars for night */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-stars"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <NightStars opacity={cfg.starOpacity} />
        </motion.div>
      </AnimatePresence>

      {/* Islamic patterns */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-pattern"}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.4 }}
        >
          <PatternLayer color={cfg.patternColor} opacity={cfg.patternOpacity} />
        </motion.div>
      </AnimatePresence>

      {/* Circular logo — center top */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-logo"}
          className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: 22 }}
          initial={{ opacity: 0, scale: 0.75, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div
            className="w-[68px] h-[68px] rounded-full overflow-hidden"
            style={{
              border: `2.5px solid ${cfg.accentColor}aa`,
              boxShadow: `0 0 20px ${cfg.accentColor}66, 0 0 40px ${cfg.accentColor}33`,
            }}
          >
            <img src="/images/logo.png" alt="التوبة" className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Period badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period + "-badge"}
          className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: 100 }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full border"
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

      {/* AI Content card */}
      <div className="absolute inset-x-0 px-4" style={{ top: 128 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border px-4 py-3 flex items-center gap-2"
              style={{
                backgroundColor: `${cfg.skyTop}cc`,
                borderColor: `${cfg.accentColor}33`,
                backdropFilter: "blur(8px)",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ color: cfg.accentColor, opacity: 0.7 }}
              >
                <Sparkles size={14} />
              </motion.div>
              <span className="text-[11px]" style={{ color: `${cfg.textColor}99` }}>
                زكي يُعد لك محتوى اليوم...
              </span>
            </motion.div>
          ) : item ? (
            <motion.div
              key={`item-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border px-4 py-3 cursor-pointer select-none"
              style={{
                backgroundColor: `${cfg.skyTop}cc`,
                borderColor: `${cfg.accentColor}44`,
                backdropFilter: "blur(8px)",
              }}
              onClick={() => setIdx((i) => (i + 1) % items.length)}
            >
              <div className="flex items-center gap-2 mb-2">
                {meta && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${meta.color}25`, color: meta.color, filter: "brightness(1.6)" }}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                )}
                {item.source && (
                  <span className="text-[9px]" style={{ color: `${cfg.textColor}60` }}>
                    {item.source}
                  </span>
                )}
                <span className="mr-auto text-[9px]" style={{ color: `${cfg.textColor}45` }}>
                  اضغط للتالي ›
                </span>
              </div>
              <p
                className="text-[12px] leading-relaxed font-medium"
                style={{ color: cfg.textColor }}
                dir="rtl"
              >
                {item.text}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Dots indicator */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 16 : 5,
                  height: 5,
                  backgroundColor: i === idx ? cfg.accentColor : `${cfg.textColor}40`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
