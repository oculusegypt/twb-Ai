import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Star, Sparkles, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useLocation } from "wouter";

interface HeroItem {
  type: "ayah" | "hadith" | "dhikr" | "nafl" | "dua" | "wisdom";
  text: string;
  source?: string;
}

const TYPE_META: Record<HeroItem["type"], { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ayah:    { label: "آية كريمة",   icon: <BookOpen size={10} />,     color: "#fbbf24", bg: "rgba(251,191,36,0.18)"  },
  hadith:  { label: "حديث شريف",  icon: <MessageCircle size={10} />, color: "#fcd34d", bg: "rgba(252,211,77,0.18)"  },
  dhikr:   { label: "ذكر مأثور",  icon: <Star size={10} />,          color: "#6ee7b7", bg: "rgba(110,231,183,0.18)" },
  nafl:    { label: "نافلة وسنة", icon: <Sun size={10} />,           color: "#93c5fd", bg: "rgba(147,197,253,0.18)" },
  dua:     { label: "دعاء مأثور", icon: <Moon size={10} />,          color: "#c4b5fd", bg: "rgba(196,181,253,0.18)" },
  wisdom:  { label: "نصيحة",      icon: <Sparkles size={10} />,     color: "#fda4af", bg: "rgba(253,164,175,0.18)" },
};

const CACHE_KEY = "hero_content_cache_v3";
const CACHE_TTL = 60 * 60 * 1000;

function loadCache(): HeroItem[] | null {
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
  } catch {}
}

const FALLBACK: HeroItem[] = [
  { type: "ayah",    text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", source: "الزمر: 53" },
  { type: "hadith",  text: "التائبُ من الذنبِ كمن لا ذنبَ له", source: "ابن ماجه" },
  { type: "wisdom",  text: "البداية الحقيقية لا تحتاج يوماً جديداً — تحتاج نية صادقة في هذه اللحظة" },
  { type: "dhikr",   text: "سبحان الله وبحمده، سبحان الله العظيم", source: "خفيفتان ثقيلتان في الميزان" },
  { type: "ayah",    text: "وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ", source: "طه: 82" },
];

const LIGHT_THEME_CONFIG: Record<string, {
  bg: string; shimmer: string; glowColor: string;
  textColor: string; subColor: string; cardBg: string; cardBorder: string;
}> = {
  forest:   { bg: "linear-gradient(160deg, #f0faf4 0%, #e2f4ea 40%, #cee8d6 100%)", shimmer: "rgba(23,77,43,0.6)", glowColor: "rgba(23,77,43,0.12)", textColor: "#174d2b", subColor: "rgba(23,77,43,0.55)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(23,77,43,0.18)" },
  ocean:    { bg: "linear-gradient(160deg, #eff7ff 0%, #daeeff 40%, #c3e2f8 100%)", shimmer: "rgba(15,76,129,0.6)", glowColor: "rgba(15,76,129,0.1)", textColor: "#0f4c81", subColor: "rgba(15,76,129,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(15,76,129,0.18)" },
  aurora:   { bg: "linear-gradient(160deg, #f9f0ff 0%, #ede0ff 40%, #ddc9fc 100%)", shimmer: "rgba(107,33,168,0.55)", glowColor: "rgba(107,33,168,0.1)", textColor: "#6b21a8", subColor: "rgba(107,33,168,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(107,33,168,0.18)" },
  midnight: { bg: "linear-gradient(160deg, #eff2ff 0%, #dde5ff 40%, #c8d6fd 100%)", shimmer: "rgba(30,58,138,0.6)", glowColor: "rgba(30,58,138,0.1)", textColor: "#1e3a8a", subColor: "rgba(30,58,138,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(30,58,138,0.18)" },
  rose:     { bg: "linear-gradient(160deg, #fff0f5 0%, #ffe0ef 40%, #ffcce5 100%)", shimmer: "rgba(159,18,57,0.55)", glowColor: "rgba(159,18,57,0.1)", textColor: "#9f1239", subColor: "rgba(159,18,57,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(159,18,57,0.18)" },
  sunset:   { bg: "linear-gradient(160deg, #fffbf0 0%, #fff0d4 40%, #ffe4b2 100%)", shimmer: "rgba(146,64,14,0.6)", glowColor: "rgba(146,64,14,0.1)", textColor: "#92400e", subColor: "rgba(146,64,14,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(146,64,14,0.18)" },
  slate:    { bg: "linear-gradient(160deg, #f0f4ff 0%, #dde7f5 40%, #c8d8ee 100%)", shimmer: "rgba(30,58,95,0.6)", glowColor: "rgba(30,58,95,0.1)", textColor: "#1e3a5f", subColor: "rgba(30,58,95,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(30,58,95,0.18)" },
  mint:     { bg: "linear-gradient(160deg, #f0fefa 0%, #d8f8ef 40%, #c0f2e4 100%)", shimmer: "rgba(6,95,70,0.6)", glowColor: "rgba(6,95,70,0.1)", textColor: "#065f46", subColor: "rgba(6,95,70,0.5)", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(6,95,70,0.18)" },
};

// ── Typing effect hook ──────────────────────────────────────────────────────
function useTypingText(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

// ── Zakiy AI Orb ────────────────────────────────────────────────────────────
function ZakiyOrb({ isDark, onClick }: { isDark: boolean; onClick: () => void }) {
  const bars = [0.4, 0.7, 1, 0.85, 0.55, 0.9, 0.65, 0.45, 0.75, 1, 0.6, 0.8, 0.5, 0.95, 0.7];

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "backOut" }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center gap-2 cursor-pointer group"
      aria-label="تحدث مع زكي"
    >
      {/* Outer glow ring */}
      <div className="relative">
        {/* Animated pulse rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: `1.5px solid ${isDark ? "rgba(99,179,237,0.4)" : "rgba(59,130,246,0.35)"}`,
              margin: -(i * 10),
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
          />
        ))}

        {/* Main orb container */}
        <div
          className="relative w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: isDark
              ? "radial-gradient(circle at 35% 30%, #60a5fa 0%, #3b82f6 30%, #1d4ed8 60%, #1e3a8a 100%)"
              : "radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 30%, #1d4ed8 60%, #1e40af 100%)",
            boxShadow: isDark
              ? "0 0 0 2px rgba(96,165,250,0.3), 0 0 30px rgba(59,130,246,0.6), 0 0 60px rgba(59,130,246,0.25), 0 8px 32px rgba(0,0,0,0.5)"
              : "0 0 0 2px rgba(59,130,246,0.25), 0 0 24px rgba(59,130,246,0.45), 0 0 48px rgba(59,130,246,0.2), 0 6px 20px rgba(0,0,0,0.15)",
          }}
        >
          {/* Gloss overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.35) 0%, transparent 60%)" }}
          />

          {/* Inner shimmer ring */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Sound wave bars */}
          <div className="relative z-10 flex items-center gap-[2.5px]">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 2.5,
                  background: "rgba(255,255,255,0.9)",
                  originY: "50%",
                }}
                animate={{ scaleY: [h * 0.3, h, h * 0.5, h * 0.8, h * 0.3] }}
                transition={{
                  duration: 1.2 + (i % 4) * 0.15,
                  repeat: Infinity,
                  delay: i * 0.06,
                  ease: "easeInOut",
                }}
                initial={{ height: Math.round(h * 30) }}
              />
            ))}
          </div>

          {/* Rotating arc */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.15) 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* AI badge on orb */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide whitespace-nowrap"
          style={{
            background: isDark ? "rgba(30,58,138,0.9)" : "rgba(29,78,216,0.9)",
            color: "#bfdbfe",
            border: "1px solid rgba(96,165,250,0.4)",
            backdropFilter: "blur(4px)",
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          AI ✦
        </motion.div>
      </div>

      {/* Label */}
      <motion.div className="flex flex-col items-center gap-0.5">
        <span
          className="text-[13px] font-bold tracking-wide"
          style={{
            color: isDark ? "#93c5fd" : "#1d4ed8",
            textShadow: isDark ? "0 0 16px rgba(59,130,246,0.6)" : "none",
          }}
        >
          تحدث مع زكي
        </span>
        <span
          className="text-[10px]"
          style={{ color: isDark ? "rgba(147,197,253,0.6)" : "rgba(29,78,216,0.55)" }}
        >
          مرشدك بالذكاء الاصطناعي
        </span>
      </motion.div>
    </motion.button>
  );
}

// ── Islamic geometry SVGs ───────────────────────────────────────────────────
function IslamicGeometryDark() {
  return (
    <svg viewBox="0 0 400 360" preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <radialGradient id="goldGlowD" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blueGlowD" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.18" stroke="#fbbf24" strokeWidth="0.7" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,14 Q50,8 100,14 Q150,20 200,14 Q250,8 300,14 Q350,20 400,14" />
      </g>
      <g transform="translate(38,68)" opacity="0.13">
        <polygon points={Array.from({ length: 12 }, (_, i) => { const a = i * 30; const r1 = 36, r2 = 16; const toRad = (d: number) => (d - 90) * Math.PI / 180; return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`].join(" "); }).join(" ")}
          fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="5" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.6" />
      </g>
      <g transform="translate(362,52)" opacity="0.12">
        <polygon points={Array.from({ length: 8 }, (_, i) => { const a = i * 45; const r1 = 26, r2 = 11; const toRad = (d: number) => (d - 90) * Math.PI / 180; return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`].join(" "); }).join(" ")}
          fill="rgba(59,130,246,0.08)" stroke="#60a5fa" strokeWidth="0.9" />
        <circle cx="0" cy="0" r="3.5" fill="none" stroke="#60a5fa" strokeWidth="0.7" />
      </g>
      <g transform="translate(375,120)" opacity="0.16">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill="#fbbf24" />
      </g>
      {([[118,16,1.6,"#fbbf24"],[284,20,1.1,"#60a5fa"],[74,88,0.9,"#fbbf24"],[336,74,1.3,"#60a5fa"],[158,44,0.8,"#fbbf24"],[242,52,1.0,"#60a5fa"]] as [number,number,number,string][]).map(([cx, cy, r, c], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={c} opacity="0.28" />
      ))}
      <ellipse cx="200" cy="80" rx="180" ry="100" fill="url(#goldGlowD)" opacity="0.07" />
      <ellipse cx="330" cy="60" rx="80" ry="60" fill="url(#blueGlowD)" opacity="0.08" />
    </svg>
  );
}

function IslamicGeometryLight({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 400 360" preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <radialGradient id="lglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.2" stroke={color} strokeWidth="0.8" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,15 Q50,9 100,15 Q150,21 200,15 Q250,9 300,15 Q350,21 400,15" />
      </g>
      <g transform="translate(42,72)" opacity="0.18">
        <polygon points={Array.from({ length: 12 }, (_, i) => { const a = i * 30; const r1 = 38, r2 = 17; const toRad = (d: number) => (d - 90) * Math.PI / 180; return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`].join(" "); }).join(" ")}
          fill={color} fillOpacity="0.07" stroke={color} strokeWidth="0.9" />
        <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="0.9" />
        <circle cx="0" cy="0" r="2.5" fill={color} opacity="0.5" />
      </g>
      <g transform="translate(358,56)" opacity="0.15">
        <polygon points={Array.from({ length: 8 }, (_, i) => { const a = i * 45; const r1 = 28, r2 = 12; const toRad = (d: number) => (d - 90) * Math.PI / 180; return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`].join(" "); }).join(" ")}
          fill={color} fillOpacity="0.06" stroke={color} strokeWidth="0.9" />
        <circle cx="0" cy="0" r="4" fill="none" stroke={color} strokeWidth="0.7" />
      </g>
      <g transform="translate(372,128)" opacity="0.2">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill={color} />
      </g>
      {([[120,18,1.8],[285,22,1.2],[78,92,1.0],[338,78,1.4],[162,46,0.9],[244,54,1.1]] as [number,number,number][]).map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity="0.3" />
      ))}
      <ellipse cx="200" cy="90" rx="190" ry="110" fill="url(#lglow)" opacity="0.12" />
    </svg>
  );
}

function MosqueSilhouetteDark() {
  return (
    <div className="absolute bottom-0 inset-x-0 w-full pointer-events-none" style={{ height: 90 }}>
      <img src="/images/mosque-silhouette.png" alt="" aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.10, filter: "brightness(0) invert(1)" }} />
    </div>
  );
}

function MosqueSilhouetteLight({ color }: { color: string }) {
  return (
    <div className="absolute bottom-0 inset-x-0 w-full pointer-events-none" style={{ height: 90 }}>
      <img src="/images/mosque-silhouette.png" alt="" aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.08, filter: `brightness(0) saturate(100%)` }} />
    </div>
  );
}

// ── Animated mesh gradient background spots ─────────────────────────────────
function MeshSpots({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: 220, height: 180, top: -40, left: "10%",
          background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
        }}
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[50px]"
        style={{
          width: 160, height: 140, top: 20, right: "5%",
          background: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.07)",
        }}
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full blur-[40px]"
        style={{
          width: 120, height: 100, bottom: 20, left: "30%",
          background: isDark ? "rgba(99,179,237,0.07)" : "rgba(99,179,237,0.06)",
        }}
        animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function IslamicHero() {
  const [items, setItems]     = useState<HeroItem[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, accentColor } = useSettings();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  const fetchContent = useCallback(async () => {
    const cached = loadCache();
    if (cached?.length) { setItems(cached); setLoading(false); return; }
    try {
      const res = await fetch("/api/hero-content");
      if (!res.ok) throw new Error("failed");
      const data = await res.json() as { items: HeroItem[] };
      const list = data.items?.length ? data.items : FALLBACK;
      saveCache(list);
      setItems(list);
    } catch { setItems(FALLBACK); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    if (!items.length) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % items.length), 9000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  const goNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i + 1) % items.length);
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % items.length), 9000);
  };
  const goPrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIdx((i) => (i - 1 + items.length) % items.length);
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % items.length), 9000);
  };

  const item = items[idx] ?? null;
  const meta = item ? TYPE_META[item.type] : null;
  const lightCfg = LIGHT_THEME_CONFIG[accentColor] ?? LIGHT_THEME_CONFIG.mint!;

  const bgStyle = isDark
    ? { background: "linear-gradient(160deg, #06111e 0%, #071826 25%, #091c1a 55%, #060f14 100%)" }
    : { background: lightCfg.bg };

  const topLineColor = isDark
    ? "linear-gradient(to right, transparent 0%, rgba(251,191,36,0.7) 30%, rgba(96,165,250,0.7) 55%, rgba(251,191,36,0.7) 75%, transparent 100%)"
    : `linear-gradient(to right, transparent 0%, ${lightCfg.shimmer} 35%, ${lightCfg.shimmer} 65%, transparent 100%)`;

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{
        minHeight: 420,
        ...bgStyle,
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
      }}
    >
      {/* Mesh animated spots */}
      <MeshSpots isDark={isDark} />

      {/* Islamic geometry */}
      {isDark ? <IslamicGeometryDark /> : <IslamicGeometryLight color={lightCfg.shimmer} />}
      {isDark ? <MosqueSilhouetteDark /> : <MosqueSilhouetteLight color={lightCfg.textColor} />}

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
        style={{ background: topLineColor }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pt-6 pb-6 px-5">

        {/* AI powered badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
            style={isDark
              ? { background: "rgba(30,58,138,0.55)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.25)", backdropFilter: "blur(8px)" }
              : { background: "rgba(219,234,254,0.8)", color: "#1d4ed8", border: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(8px)" }
            }
          >
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              ✦
            </motion.span>
            مدعوم بالذكاء الاصطناعي
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}>
              ✦
            </motion.span>
          </div>
        </motion.div>

        {/* App logo (small) + title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 mb-4"
        >
          <div
            className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
            style={isDark
              ? { border: "1px solid rgba(251,191,36,0.3)", boxShadow: "0 0 12px rgba(251,191,36,0.2)" }
              : { border: `1px solid ${lightCfg.cardBorder}`, boxShadow: `0 0 10px ${lightCfg.glowColor}` }
            }
          >
            <img src="/images/logo.png" alt="دليل التوبة" className="w-full h-full object-cover" />
          </div>
          <h1
            className="text-[16px] font-bold tracking-wide"
            style={isDark
              ? { color: "#f5c842", textShadow: "0 0 20px rgba(251,191,36,0.4)" }
              : { color: lightCfg.textColor }
            }
          >
            دليل التوبة النصوح
          </h1>
        </motion.div>

        {/* Zakiy AI Orb */}
        <div className="mb-5">
          <ZakiyOrb isDark={isDark} onClick={() => navigate("/zakiy")} />
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center gap-2 mb-4 w-full max-w-xs"
        >
          <div style={{ flex: 1, height: 1, background: isDark ? "linear-gradient(to left, rgba(251,191,36,0.4), transparent)" : `linear-gradient(to left, ${lightCfg.shimmer}, transparent)` }} />
          <span className="text-[10px]" style={{ color: isDark ? "rgba(200,230,215,0.4)" : lightCfg.subColor }}>
            رحلتك نحو الله تبدأ هنا
          </span>
          <div style={{ flex: 1, height: 1, background: isDark ? "linear-gradient(to right, rgba(251,191,36,0.4), transparent)" : `linear-gradient(to right, ${lightCfg.shimmer}, transparent)` }} />
        </motion.div>

        {/* Content card */}
        <ContentCard
          item={item} meta={meta} loading={loading} items={items} idx={idx}
          goNext={goNext} goPrev={goPrev} timerRef={timerRef} isDark={isDark}
          lightCfg={lightCfg}
        />
      </div>
    </div>
  );
}

// ── Content card with typing effect ────────────────────────────────────────
interface ContentCardProps {
  item: HeroItem | null;
  meta: typeof TYPE_META[HeroItem["type"]] | null;
  loading: boolean;
  items: HeroItem[];
  idx: number;
  goNext: () => void;
  goPrev: () => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  isDark: boolean;
  lightCfg: typeof LIGHT_THEME_CONFIG[string];
}

function TypingText({ text, type, textColor }: { text: string; type: HeroItem["type"]; textColor: string }) {
  const fullText = type === "ayah" ? (text.startsWith("﴿") ? text : `﴿${text}﴾`) : text;
  const { displayed, done } = useTypingText(fullText, 22);
  return (
    <p className="text-[13px] leading-[1.9] font-medium text-center" style={{ color: textColor }} dir="rtl">
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: textColor, opacity: 0.7 }}
        >|</motion.span>
      )}
    </p>
  );
}

function ContentCard({ item, meta, loading, items, idx, goNext, goPrev, timerRef, isDark, lightCfg }: ContentCardProps) {
  const cardBg     = isDark ? "rgba(255,255,255,0.05)" : lightCfg.cardBg;
  const cardBorder = isDark ? "rgba(251,191,36,0.16)"  : lightCfg.cardBorder;
  const cardShadow = isDark
    ? "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(251,191,36,0.1)"
    : "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)";
  const headerBg   = isDark ? "linear-gradient(to right, rgba(251,191,36,0.05), transparent)" : `linear-gradient(to right, ${lightCfg.glowColor}, transparent)`;
  const headerBorder = isDark ? "rgba(251,191,36,0.1)" : lightCfg.cardBorder;
  const labelColor = isDark ? "rgba(251,191,36,0.85)" : lightCfg.textColor;
  const subColor   = isDark ? "rgba(200,230,215,0.5)"  : lightCfg.subColor;
  const textColor  = isDark ? "rgba(240,255,245,0.92)" : lightCfg.textColor;
  const dotActive  = isDark ? "#fbbf24" : lightCfg.textColor;
  const dotInactive = isDark ? "rgba(251,191,36,0.18)" : lightCfg.cardBorder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="w-full max-w-sm"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, backdropFilter: "blur(12px)" }}
      >
        {/* Card header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: `1px solid ${headerBorder}`, background: headerBg }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {meta ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: meta.bg, color: meta.color }}>
                {meta.icon}{meta.label}
              </span>
            ) : (
              <Sparkles size={12} style={{ color: labelColor }} />
            )}
            {item?.source && (
              <span className="text-[10px] truncate" style={{ color: subColor }}>{item.source}</span>
            )}
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={goPrev}
                className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                style={{ color: labelColor, background: headerBorder }}
                aria-label="السابق">
                <ChevronRight size={13} />
              </button>
              <span className="text-[10px] tabular-nums" style={{ color: subColor }}>{idx + 1}/{items.length}</span>
              <button onClick={goNext}
                className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                style={{ color: labelColor, background: headerBorder }}
                aria-label="التالي">
                <ChevronLeft size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-[2px] w-full" style={{ background: dotInactive }}>
          <motion.div key={idx} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 9, ease: "linear" }}
            className="h-full origin-right" style={{ background: dotActive, opacity: 0.7 }} />
        </div>

        {/* Card body */}
        <div className="min-h-[82px] px-4 py-3.5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2.5 h-full py-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  style={{ color: labelColor }}>
                  <Sparkles size={13} />
                </motion.div>
                <p className="text-[12px]" style={{ color: subColor }}>زكي يُعد محتوى اليوم...</p>
              </motion.div>
            ) : item ? (
              <motion.div key={`item-${idx}`}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col items-center">
                <TypingText text={item.text} type={item.type} textColor={textColor} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {items.map((_, i) => (
              <button key={i}
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? 18 : 5, height: 5, background: i === idx ? dotActive : dotInactive }}
                aria-label={`الانتقال إلى ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
