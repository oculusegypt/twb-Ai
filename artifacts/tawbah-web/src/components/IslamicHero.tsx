import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Star, Sparkles, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";

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

function IslamicGeometry() {
  return (
    <svg
      viewBox="0 0 400 300"
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

      {/* ── Arabesque border top ── */}
      <g opacity="0.18" stroke="#fbbf24" strokeWidth="0.7" fill="none">
        <path d="M0,8 Q50,2 100,8 Q150,14 200,8 Q250,2 300,8 Q350,14 400,8" />
        <path d="M0,14 Q50,8 100,14 Q150,20 200,14 Q250,8 300,14 Q350,20 400,14" />
      </g>

      {/* ── Large 12-point star — far left ── */}
      <g transform="translate(38,68)" opacity="0.13">
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * 30;
          const r1 = 36, r2 = 16;
          const toRad = (d: number) => (d - 90) * Math.PI / 180;
          const x1 = r1 * Math.cos(toRad(a)), y1 = r1 * Math.sin(toRad(a));
          const x2 = r2 * Math.cos(toRad(a + 15)), y2 = r2 * Math.sin(toRad(a + 15));
          return <line key={i} x1="0" y1="0" x2={x1} y2={y1} stroke="#fbbf24" strokeWidth="0.8" />;
        })}
        <polygon
          points={Array.from({ length: 12 }, (_, i) => {
            const a = i * 30;
            const r1 = 36, r2 = 16;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 15))},${r2 * Math.sin(toRad(a + 15))}`,
            ].join(" ");
          }).join(" ")}
          fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth="0.8"
        />
        <circle cx="0" cy="0" r="5" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.6" />
      </g>

      {/* ── 8-point star — top right ── */}
      <g transform="translate(362,52)" opacity="0.12">
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 45;
            const r1 = 26, r2 = 11;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
            ].join(" ");
          }).join(" ")}
          fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="0.9"
        />
        <circle cx="0" cy="0" r="3.5" fill="none" stroke="#fbbf24" strokeWidth="0.7" />
        <circle cx="0" cy="0" r="1.5" fill="#fbbf24" opacity="0.5" />
      </g>

      {/* ── Small star — upper center ── */}
      <g transform="translate(200,28)" opacity="0.10">
        <polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = i * 60;
            const r1 = 16, r2 = 7;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 30))},${r2 * Math.sin(toRad(a + 30))}`,
            ].join(" ");
          }).join(" ")}
          fill="none" stroke="#6ee7b7" strokeWidth="0.8"
        />
      </g>

      {/* ── Geometric lattice / muqarnas grid ── */}
      <g opacity="0.055" stroke="#fbbf24" strokeWidth="0.5" fill="none">
        <line x1="38" y1="68" x2="200" y2="28" />
        <line x1="200" y1="28" x2="362" y2="52" />
        <line x1="38" y1="68" x2="90" y2="170" />
        <line x1="362" y1="52" x2="310" y2="170" />
        <line x1="90" y1="170" x2="200" y2="150" />
        <line x1="200" y1="150" x2="310" y2="170" />
        <line x1="0" y1="130" x2="400" y2="130" strokeDasharray="3,8" strokeOpacity="0.5" />
      </g>

      {/* ── Crescent — right ── */}
      <g transform="translate(375,120)" opacity="0.16">
        <path d="M0,-20 a20,20 0 1,1 14,34 a14,14 0 1,0 -14,-34" fill="#fbbf24" />
      </g>

      {/* ── Tiny dot sparkles ── */}
      {[
        [118, 16, 1.6], [284, 20, 1.1], [74, 88, 0.9],
        [336, 74, 1.3], [158, 44, 0.8], [242, 52, 1.0],
        [310, 100, 0.7], [66, 140, 0.6], [180, 18, 0.9],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fbbf24" opacity="0.28" />
      ))}

      {/* ── Radial glow center ── */}
      <ellipse cx="200" cy="80" rx="180" ry="100" fill="url(#goldGlow)" opacity="0.07" />

      {/* ── Corner arabesque motifs ── */}
      <g transform="translate(0,0)" opacity="0.08" stroke="#fbbf24" strokeWidth="0.6" fill="none">
        <path d="M0,40 Q20,20 40,0" />
        <path d="M0,55 Q28,28 55,0" />
      </g>
      <g transform="translate(400,0) scale(-1,1)" opacity="0.08" stroke="#fbbf24" strokeWidth="0.6" fill="none">
        <path d="M0,40 Q20,20 40,0" />
        <path d="M0,55 Q28,28 55,0" />
      </g>
    </svg>
  );
}

function MosqueSilhouette() {
  return (
    <div
      className="absolute bottom-0 inset-x-0 w-full pointer-events-none"
      style={{ height: 90 }}
    >
      <img
        src="/images/mosque-silhouette.png"
        alt=""
        aria-hidden
        className="w-full h-full object-cover object-bottom"
        style={{ opacity: 0.10, filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

export function IslamicHero() {
  const [items, setItems]     = useState<HeroItem[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        minHeight: 290,
        background: [
          "linear-gradient(175deg,",
          "  #06111e 0%,",
          "  #071620 18%,",
          "  #091c1a 42%,",
          "  #081917 65%,",
          "  #060f14 85%,",
          "  #040c11 100%",
          ")",
        ].join(""),
      }}
    >
      {/* Ambient glow layers */}
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


      {/* Islamic geometric SVG */}
      <IslamicGeometry />

      {/* Mosque silhouette */}
      <MosqueSilhouette />

      {/* Top gold shimmer line */}
      <div
        className="absolute top-0 inset-x-0 h-[1.5px] pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent 0%, rgba(251,191,36,0.6) 30%, rgba(251,191,36,0.8) 50%, rgba(251,191,36,0.6) 70%, transparent 100%)" }}
      />

      {/* Subtle inner glow border */}
      <div
        className="absolute top-0 inset-x-0 h-20 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.04) 0%, transparent 100%)" }}
      />

      {/* Bottom fade — long & gradual so it never looks like a hard edge */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none z-20"
        style={{
          height: 180,
          background: [
            "linear-gradient(to bottom,",
            "  transparent 0%,",
            "  hsl(var(--background) / 0.08) 25%,",
            "  hsl(var(--background) / 0.30) 50%,",
            "  hsl(var(--background) / 0.65) 72%,",
            "  hsl(var(--background) / 0.88) 88%,",
            "  hsl(var(--background)) 100%",
            ")",
          ].join(""),
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pt-7 pb-5 px-5">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="mb-3"
        >
          <div
            className="w-[70px] h-[70px] rounded-full overflow-hidden"
            style={{
              border: "2px solid rgba(251,191,36,0.5)",
              boxShadow: [
                "0 0 0 4px rgba(251,191,36,0.08)",
                "0 0 28px rgba(251,191,36,0.3)",
                "0 0 56px rgba(251,191,36,0.12)",
                "0 6px 24px rgba(0,0,0,0.5)",
              ].join(", "),
            }}
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
          style={{
            color: "#f5c842",
            textShadow: "0 0 24px rgba(251,191,36,0.45), 0 0 60px rgba(251,191,36,0.18)",
            letterSpacing: "0.06em",
          }}
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
          <div style={{ width: 28, height: 1, background: "linear-gradient(to left, rgba(251,191,36,0.5), transparent)" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(251,191,36,0.55)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
          <span className="text-[11px] font-medium" style={{ color: "rgba(200,230,215,0.55)", letterSpacing: "0.04em" }}>
            رحلتك نحو الله تبدأ هنا
          </span>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(251,191,36,0.55)", boxShadow: "0 0 6px rgba(251,191,36,0.4)" }} />
          <div style={{ width: 28, height: 1, background: "linear-gradient(to right, rgba(251,191,36,0.5), transparent)" }} />
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
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(251,191,36,0.18)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(251,191,36,0.12)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: "1px solid rgba(251,191,36,0.1)",
                background: "linear-gradient(to right, rgba(251,191,36,0.06), transparent)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} style={{ color: "#fbbf24" }} />
                <span className="text-[11px] font-bold" style={{ color: "rgba(251,191,36,0.85)" }}>
                  زكي يُذكّرك
                </span>
              </div>
              {items.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.08)" }}
                    aria-label="السابق"
                  >
                    <ChevronRight size={13} />
                  </button>
                  <span className="text-[10px] tabular-nums" style={{ color: "rgba(200,230,210,0.5)" }}>
                    {idx + 1}/{items.length}
                  </span>
                  <button
                    onClick={goNext}
                    className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.08)" }}
                    aria-label="التالي"
                  >
                    <ChevronLeft size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="min-h-[78px] px-4 py-3.5">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ color: "rgba(251,191,36,0.6)" }}
                    >
                      <Sparkles size={13} />
                    </motion.div>
                    <p className="text-[12px]" style={{ color: "rgba(200,230,210,0.5)" }}>
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
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {meta && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.icon}
                          {meta.label}
                        </span>
                      )}
                      {item.source && (
                        <span className="text-[10px]" style={{ color: "rgba(200,230,210,0.45)" }}>
                          {item.source}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[13px] leading-[1.9] font-medium"
                      style={{ color: "rgba(240,255,245,0.92)" }}
                      dir="rtl"
                    >
                      {item.text}
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
                    onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setIdx(i); }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === idx ? 18 : 5,
                      height: 5,
                      background: i === idx ? "#fbbf24" : "rgba(251,191,36,0.22)",
                    }}
                    aria-label={`الانتقال إلى ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
