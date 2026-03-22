import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Star, Sparkles, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

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

// الخلفيات الإسلامية للوضع النهاري حسب الثيم
const LIGHT_THEME_CONFIG: Record<string, {
  bg: string;
  shimmer: string;
  glowColor: string;
  textColor: string;
  subColor: string;
  cardBg: string;
  cardBorder: string;
}> = {
  forest: {
    bg: "linear-gradient(175deg, #f0faf4 0%, #e6f5ec 30%, #d8edd9 65%, #c9e3cc 100%)",
    shimmer: "rgba(23,77,43,0.6)",
    glowColor: "rgba(23,77,43,0.12)",
    textColor: "#174d2b",
    subColor: "rgba(23,77,43,0.55)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(23,77,43,0.18)",
  },
  ocean: {
    bg: "linear-gradient(175deg, #eff7ff 0%, #e0effc 30%, #cde6fa 65%, #bad9f5 100%)",
    shimmer: "rgba(15,76,129,0.6)",
    glowColor: "rgba(15,76,129,0.1)",
    textColor: "#0f4c81",
    subColor: "rgba(15,76,129,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(15,76,129,0.18)",
  },
  aurora: {
    bg: "linear-gradient(175deg, #f9f0ff 0%, #f1e4ff 30%, #e8d4fd 65%, #dcc0fb 100%)",
    shimmer: "rgba(107,33,168,0.55)",
    glowColor: "rgba(107,33,168,0.1)",
    textColor: "#6b21a8",
    subColor: "rgba(107,33,168,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(107,33,168,0.18)",
  },
  midnight: {
    bg: "linear-gradient(175deg, #eff2ff 0%, #e1e8ff 30%, #d0dafd 65%, #bec9fc 100%)",
    shimmer: "rgba(30,58,138,0.6)",
    glowColor: "rgba(30,58,138,0.1)",
    textColor: "#1e3a8a",
    subColor: "rgba(30,58,138,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(30,58,138,0.18)",
  },
  rose: {
    bg: "linear-gradient(175deg, #fff0f5 0%, #ffe4ef 30%, #ffd4e7 65%, #ffc3db 100%)",
    shimmer: "rgba(159,18,57,0.55)",
    glowColor: "rgba(159,18,57,0.1)",
    textColor: "#9f1239",
    subColor: "rgba(159,18,57,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(159,18,57,0.18)",
  },
  sunset: {
    bg: "linear-gradient(175deg, #fffbf0 0%, #fff3d9 30%, #ffe9bd 65%, #ffdea0 100%)",
    shimmer: "rgba(146,64,14,0.6)",
    glowColor: "rgba(146,64,14,0.1)",
    textColor: "#92400e",
    subColor: "rgba(146,64,14,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(146,64,14,0.18)",
  },
  slate: {
    bg: "linear-gradient(175deg, #f0f4ff 0%, #e2eaf8 30%, #d3dfef 65%, #c4d3e6 100%)",
    shimmer: "rgba(30,58,95,0.6)",
    glowColor: "rgba(30,58,95,0.1)",
    textColor: "#1e3a5f",
    subColor: "rgba(30,58,95,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(30,58,95,0.18)",
  },
  mint: {
    bg: "linear-gradient(175deg, #f0fefa 0%, #e0faf3 30%, #ccf5e8 65%, #b8efdd 100%)",
    shimmer: "rgba(6,95,70,0.6)",
    glowColor: "rgba(6,95,70,0.1)",
    textColor: "#065f46",
    subColor: "rgba(6,95,70,0.5)",
    cardBg: "rgba(255,255,255,0.72)",
    cardBorder: "rgba(6,95,70,0.18)",
  },
};

function IslamicGeometryLight({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="lglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Arabesque border top */}
      <g opacity="0.2" stroke={color} strokeWidth="0.8" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,15 Q50,9 100,15 Q150,21 200,15 Q250,9 300,15 Q350,21 400,15" />
      </g>

      {/* Large 12-point star — left */}
      <g transform="translate(42,72)" opacity="0.18">
        <polygon
          points={Array.from({ length: 12 }, (_, i) => {
            const a = i * 30; const r1 = 38, r2 = 17;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`].join(" ");
          }).join(" ")}
          fill={color} fillOpacity="0.07" stroke={color} strokeWidth="0.9"
        />
        <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="0.9" />
        <circle cx="0" cy="0" r="2.5" fill={color} opacity="0.5" />
      </g>

      {/* 8-point star — top right */}
      <g transform="translate(358,56)" opacity="0.15">
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 45; const r1 = 28, r2 = 12;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`].join(" ");
          }).join(" ")}
          fill={color} fillOpacity="0.06" stroke={color} strokeWidth="0.9"
        />
        <circle cx="0" cy="0" r="4" fill="none" stroke={color} strokeWidth="0.7" />
      </g>

      {/* Small 6-point star — center top */}
      <g transform="translate(200,30)" opacity="0.12">
        <polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = i * 60; const r1 = 18, r2 = 8;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 30))},${r2 * Math.sin(toRad(a + 30))}`].join(" ");
          }).join(" ")}
          fill="none" stroke={color} strokeWidth="0.85"
        />
      </g>

      {/* Lattice lines */}
      <g opacity="0.07" stroke={color} strokeWidth="0.5" fill="none">
        <line x1="42" y1="72" x2="200" y2="30" />
        <line x1="200" y1="30" x2="358" y2="56" />
        <line x1="42" y1="72" x2="95" y2="180" />
        <line x1="358" y1="56" x2="305" y2="180" />
        <line x1="95" y1="180" x2="200" y2="160" />
        <line x1="200" y1="160" x2="305" y2="180" />
        <line x1="0" y1="130" x2="400" y2="130" strokeDasharray="3,8" strokeOpacity="0.6" />
      </g>

      {/* Crescent — right */}
      <g transform="translate(372,128)" opacity="0.2">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill={color} />
      </g>

      {/* Corner arabesque */}
      <g transform="translate(0,0)" opacity="0.1" stroke={color} strokeWidth="0.7" fill="none">
        <path d="M0,44 Q22,22 44,0" /><path d="M0,60 Q30,30 60,0" />
      </g>
      <g transform="translate(400,0) scale(-1,1)" opacity="0.1" stroke={color} strokeWidth="0.7" fill="none">
        <path d="M0,44 Q22,22 44,0" /><path d="M0,60 Q30,30 60,0" />
      </g>

      {/* Dot sparkles */}
      {[[120,18,1.8],[285,22,1.2],[78,92,1.0],[338,78,1.4],[162,46,0.9],[244,54,1.1],[312,104,0.8],[68,144,0.7],[184,20,1.0]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity="0.3" />
      ))}

      {/* Central glow */}
      <ellipse cx="200" cy="90" rx="190" ry="110" fill="url(#lglow)" opacity="0.12" />
    </svg>
  );
}

function IslamicGeometryDark() {
  return (
    <svg
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity="0.18" stroke="#fbbf24" strokeWidth="0.7" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,14 Q50,8 100,14 Q150,20 200,14 Q250,8 300,14 Q350,20 400,14" />
      </g>
      <g transform="translate(38,68)" opacity="0.13">
        <polygon
          points={Array.from({ length: 12 }, (_, i) => {
            const a = i * 30; const r1 = 36, r2 = 16;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`].join(" ");
          }).join(" ")}
          fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth="0.8"
        />
        <circle cx="0" cy="0" r="5" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.6" />
      </g>
      <g transform="translate(362,52)" opacity="0.12">
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 45; const r1 = 26, r2 = 11;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`].join(" ");
          }).join(" ")}
          fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="0.9"
        />
        <circle cx="0" cy="0" r="3.5" fill="none" stroke="#fbbf24" strokeWidth="0.7" />
      </g>
      <g transform="translate(200,28)" opacity="0.10">
        <polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = i * 60; const r1 = 16, r2 = 7;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [`${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`, `${r2 * Math.cos(toRad(a + 30))},${r2 * Math.sin(toRad(a + 30))}`].join(" ");
          }).join(" ")}
          fill="none" stroke="#6ee7b7" strokeWidth="0.8"
        />
      </g>
      <g opacity="0.055" stroke="#fbbf24" strokeWidth="0.5" fill="none">
        <line x1="38" y1="68" x2="200" y2="28" /><line x1="200" y1="28" x2="362" y2="52" />
        <line x1="38" y1="68" x2="90" y2="170" /><line x1="362" y1="52" x2="310" y2="170" />
        <line x1="90" y1="170" x2="200" y2="150" /><line x1="200" y1="150" x2="310" y2="170" />
        <line x1="0" y1="130" x2="400" y2="130" strokeDasharray="3,8" strokeOpacity="0.5" />
      </g>
      <g transform="translate(375,120)" opacity="0.16">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill="#fbbf24" />
      </g>
      {[[118,16,1.6],[284,20,1.1],[74,88,0.9],[336,74,1.3],[158,44,0.8],[242,52,1.0],[310,100,0.7],[66,140,0.6],[180,18,0.9]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fbbf24" opacity="0.28" />
      ))}
      <ellipse cx="200" cy="80" rx="180" ry="100" fill="url(#goldGlow)" opacity="0.07" />
      <g transform="translate(0,0)" opacity="0.08" stroke="#fbbf24" strokeWidth="0.6" fill="none">
        <path d="M0,40 Q20,20 40,0" /><path d="M0,55 Q28,28 55,0" />
      </g>
      <g transform="translate(400,0) scale(-1,1)" opacity="0.08" stroke="#fbbf24" strokeWidth="0.6" fill="none">
        <path d="M0,40 Q20,20 40,0" /><path d="M0,55 Q28,28 55,0" />
      </g>
    </svg>
  );
}

function MosqueSilhouetteDark() {
  return (
    <div className="absolute bottom-0 inset-x-0 w-full pointer-events-none" style={{ height: 90 }}>
      <img
        src="/images/mosque-silhouette.png" alt="" aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.10, filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

function MosqueSilhouetteLight({ color }: { color: string }) {
  return (
    <div className="absolute bottom-0 inset-x-0 w-full pointer-events-none" style={{ height: 90 }}>
      <img
        src="/images/mosque-silhouette.png" alt="" aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.08, filter: `brightness(0) saturate(100%)` }}
      />
    </div>
  );
}

export function IslamicHero() {
  const [items, setItems]     = useState<HeroItem[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, accentColor } = useSettings();
  const isDark = theme === "dark";

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
    } catch {
      setItems(FALLBACK);
    } finally { setLoading(false); }
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

  // ─── DARK MODE ────────────────────────────────────────────────────────────
  if (isDark) {
    return (
      <div
        className="relative w-full select-none"
        style={{
          minHeight: 380,
          background: [
            "linear-gradient(175deg,",
            "  #06111e 0%, #071620 18%, #091c1a 42%, #081917 65%, #060f14 85%, #040c11 100%",
            ")",
          ].join(""),
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
          maskImage:        "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 70% 60% at 15% 40%, rgba(251,191,36,0.07) 0%, transparent 70%)",
              "radial-gradient(ellipse 60% 50% at 85% 25%, rgba(110,231,183,0.05) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 40% at 50% 85%, rgba(251,191,36,0.04) 0%, transparent 60%)",
            ].join(", "),
          }}
        />
        <IslamicGeometryDark />
        <MosqueSilhouetteDark />
        <div
          className="absolute top-0 inset-x-0 h-[1.5px] pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent 0%, rgba(251,191,36,0.6) 30%, rgba(251,191,36,0.8) 50%, rgba(251,191,36,0.6) 70%, transparent 100%)" }}
        />
        <div
          className="absolute top-0 inset-x-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.04) 0%, transparent 100%)" }}
        />
        <HeroContent
          item={item} meta={meta} loading={loading} items={items} idx={idx}
          goNext={goNext} goPrev={goPrev}
          logoRing="rgba(251,191,36,0.5)"
          logoGlow={["0 0 0 4px rgba(251,191,36,0.08)", "0 0 28px rgba(251,191,36,0.3)", "0 0 56px rgba(251,191,36,0.12)", "0 6px 24px rgba(0,0,0,0.5)"].join(", ")}
          titleColor="#f5c842"
          titleShadow="0 0 24px rgba(251,191,36,0.45), 0 0 60px rgba(251,191,36,0.18)"
          subColor="rgba(200,230,215,0.55)"
          dividerColor="rgba(251,191,36,0.5)"
          dotColor="rgba(251,191,36,0.55)"
          cardBg="rgba(255,255,255,0.06)"
          cardBorder="rgba(251,191,36,0.18)"
          cardShadow="0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(251,191,36,0.12)"
          headerBg="linear-gradient(to right, rgba(251,191,36,0.06), transparent)"
          headerBorder="rgba(251,191,36,0.1)"
          labelColor="rgba(251,191,36,0.85)"
          textColor="rgba(240,255,245,0.92)"
          dotActive="#fbbf24"
          dotInactive="rgba(251,191,36,0.22)"
          timerRef={timerRef}
        />
      </div>
    );
  }

  // ─── LIGHT MODE ───────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full select-none"
      style={{
        minHeight: 380,
        background: lightCfg.bg,
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
        maskImage:        "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
      }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            `radial-gradient(ellipse 70% 55% at 15% 40%, ${lightCfg.glowColor} 0%, transparent 70%)`,
            `radial-gradient(ellipse 55% 45% at 85% 25%, ${lightCfg.glowColor} 0%, transparent 65%)`,
          ].join(", "),
        }}
      />

      <IslamicGeometryLight color={lightCfg.shimmer} />
      <MosqueSilhouetteLight color={lightCfg.textColor} />

      {/* Top accent shimmer line */}
      <div
        className="absolute top-0 inset-x-0 h-[1.5px] pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent 0%, ${lightCfg.shimmer} 30%, ${lightCfg.shimmer} 70%, transparent 100%)` }}
      />

      <HeroContent
        item={item} meta={meta} loading={loading} items={items} idx={idx}
        goNext={goNext} goPrev={goPrev}
        logoRing={lightCfg.cardBorder}
        logoGlow={[`0 0 0 4px ${lightCfg.glowColor}`, `0 0 20px ${lightCfg.glowColor}`, "0 4px 16px rgba(0,0,0,0.12)"].join(", ")}
        titleColor={lightCfg.textColor}
        titleShadow={`0 0 20px ${lightCfg.glowColor}`}
        subColor={lightCfg.subColor}
        dividerColor={lightCfg.shimmer}
        dotColor={lightCfg.shimmer}
        cardBg={lightCfg.cardBg}
        cardBorder={lightCfg.cardBorder}
        cardShadow="0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)"
        headerBg={`linear-gradient(to right, ${lightCfg.glowColor}, transparent)`}
        headerBorder={lightCfg.cardBorder}
        labelColor={lightCfg.textColor}
        textColor={lightCfg.textColor}
        dotActive={lightCfg.textColor}
        dotInactive={lightCfg.cardBorder}
        timerRef={timerRef}
      />
    </div>
  );
}

// ── Shared content render ─────────────────────────────────────────────────────
interface HeroContentProps {
  item: HeroItem | null;
  meta: typeof TYPE_META[HeroItem["type"]] | null;
  loading: boolean;
  items: HeroItem[];
  idx: number;
  goNext: () => void;
  goPrev: () => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  logoRing: string;
  logoGlow: string;
  titleColor: string;
  titleShadow: string;
  subColor: string;
  dividerColor: string;
  dotColor: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  headerBg: string;
  headerBorder: string;
  labelColor: string;
  textColor: string;
  dotActive: string;
  dotInactive: string;
}

function HeroContent({
  item, meta, loading, items, idx, goNext, goPrev, timerRef,
  logoRing, logoGlow, titleColor, titleShadow, subColor,
  dividerColor, dotColor, cardBg, cardBorder, cardShadow,
  headerBg, headerBorder, labelColor, textColor, dotActive, dotInactive,
}: HeroContentProps) {
  return (
    <div className="relative z-10 flex flex-col items-center pt-8 pb-6 px-5">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="mb-3"
      >
        <div
          className="w-[96px] h-[96px] rounded-full overflow-hidden"
          style={{ border: `2px solid ${logoRing}`, boxShadow: logoGlow }}
        >
          <img src="/images/logo.png" alt="دليل التوبة" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-[17px] font-bold tracking-widest"
        style={{ color: titleColor, textShadow: titleShadow, letterSpacing: "0.06em" }}
      >
        دليل التوبة النصوح
      </motion.h1>

      {/* Decorative divider */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center gap-2 mt-2 mb-4"
      >
        <div style={{ width: 28, height: 1, background: `linear-gradient(to left, ${dividerColor}, transparent)` }} />
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
        <span className="text-[11px] font-medium" style={{ color: subColor, letterSpacing: "0.04em" }}>
          رحلتك نحو الله تبدأ هنا
        </span>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
        <div style={{ width: 28, height: 1, background: `linear-gradient(to right, ${dividerColor}, transparent)` }} />
      </motion.div>

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: `1px solid ${headerBorder}`, background: headerBg }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {meta ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              ) : (
                <Sparkles size={12} style={{ color: labelColor }} />
              )}
              {item?.source && (
                <span className="text-[10px] truncate" style={{ color: subColor }}>
                  {item.source}
                </span>
              )}
            </div>
            {items.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                  style={{ color: labelColor, background: `${headerBorder}` }}
                  aria-label="السابق"
                >
                  <ChevronRight size={13} />
                </button>
                <span className="text-[10px] tabular-nums" style={{ color: subColor }}>
                  {idx + 1}/{items.length}
                </span>
                <button
                  onClick={goNext}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                  style={{ color: labelColor, background: `${headerBorder}` }}
                  aria-label="التالي"
                >
                  <ChevronLeft size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-[2px] w-full" style={{ background: `${dotInactive}` }}>
            <motion.div
              key={idx}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 9, ease: "linear" }}
              className="h-full origin-right"
              style={{ background: dotActive, opacity: 0.7 }}
            />
          </div>

          {/* Card body */}
          <div className="min-h-[78px] px-4 py-3.5">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2.5"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ color: labelColor }}
                  >
                    <Sparkles size={13} />
                  </motion.div>
                  <p className="text-[12px]" style={{ color: subColor }}>
                    زكي يُعد محتوى اليوم...
                  </p>
                </motion.div>
              ) : item ? (
                <motion.div
                  key={`item-${idx}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <p
                    className="text-[13px] leading-[1.9] font-medium text-center"
                    style={{ color: textColor }}
                    dir="rtl"
                  >
                    {item.type === "ayah" ? (item.text.startsWith("﴿") ? item.text : `﴿${item.text}﴾`) : item.text}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          {items.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-3">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (timerRef.current) clearInterval(timerRef.current); }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === idx ? 18 : 5,
                    height: 5,
                    background: i === idx ? dotActive : dotInactive,
                  }}
                  aria-label={`الانتقال إلى ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
