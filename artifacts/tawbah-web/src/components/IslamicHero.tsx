import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageCircle, Star, Sparkles, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Cache ─────────────────────────────────────────────────────────────────────

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

// ── SVG Decorations ───────────────────────────────────────────────────────────

function IslamicStars() {
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      {/* Large 8-point star — top left */}
      <g transform="translate(44,54)" opacity="0.18">
        {[0,45,90,135,180,225,270,315].map((a, i) => {
          const r1 = 32, r2 = 14;
          const toRad = (d: number) => (d - 90) * Math.PI / 180;
          const x1 = r1 * Math.cos(toRad(a)), y1 = r1 * Math.sin(toRad(a));
          const x2 = r2 * Math.cos(toRad(a + 22.5)), y2 = r2 * Math.sin(toRad(a + 22.5));
          return <line key={i} x1="0" y1="0" x2={x1} y2={y1} stroke="#fbbf24" strokeWidth="1.2" />;
        })}
        <polygon
          points={[0,45,90,135,180,225,270,315].flatMap((a) => {
            const r1 = 32, r2 = 14;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            const x1 = r1 * Math.cos(toRad(a)), y1 = r1 * Math.sin(toRad(a));
            const x2 = r2 * Math.cos(toRad(a + 22.5)), y2 = r2 * Math.sin(toRad(a + 22.5));
            return [`${x1},${y1}`, `${x2},${y2}`];
          }).join(" ")}
          fill="none" stroke="#fbbf24" strokeWidth="1"
        />
        <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.5" />
      </g>

      {/* Medium star — top right */}
      <g transform="translate(356,40)" opacity="0.15">
        <polygon
          points={[0,45,90,135,180,225,270,315].flatMap((a) => {
            const r1 = 22, r2 = 9;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
            ];
          }).join(" ")}
          fill="none" stroke="#fbbf24" strokeWidth="1"
        />
        <circle cx="0" cy="0" r="3" fill="#fbbf24" opacity="0.4" />
      </g>

      {/* Small star — center */}
      <g transform="translate(200,34)" opacity="0.12">
        <polygon
          points={[0,45,90,135,180,225,270,315].flatMap((a) => {
            const r1 = 14, r2 = 6;
            const toRad = (d: number) => (d - 90) * Math.PI / 180;
            return [
              `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
              `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
            ];
          }).join(" ")}
          fill="none" stroke="#6ee7b7" strokeWidth="0.9"
        />
      </g>

      {/* Geometric lattice lines */}
      <g opacity="0.07" stroke="#fbbf24" strokeWidth="0.6" fill="none">
        <line x1="44" y1="54" x2="200" y2="34" />
        <line x1="200" y1="34" x2="356" y2="40" />
        <line x1="44" y1="54" x2="80" y2="160" />
        <line x1="356" y1="40" x2="320" y2="160" />
        <line x1="80" y1="160" x2="200" y2="140" />
        <line x1="200" y1="140" x2="320" y2="160" />
      </g>

      {/* Dot sparkles */}
      {[
        [120, 18, 1.4], [280, 22, 1.0], [80, 78, 0.8],
        [330, 68, 1.2], [160, 46, 0.7], [240, 50, 0.9],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fbbf24" opacity="0.35" />
      ))}

      {/* Crescent — right side */}
      <g transform="translate(370,110)" opacity="0.14">
        <path d="M0,-18 a18,18 0 1,1 13,31 a13,13 0 1,0 -13,-31" fill="#fbbf24" />
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
        style={{ opacity: 0.13, filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

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
        minHeight: 280,
        background: "linear-gradient(160deg, #0d2e1a 0%, #142f1c 40%, #0f2417 70%, #0a1e14 100%)",
        maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(251,191,36,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(110,231,183,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Islamic geometric SVG decoration */}
      <IslamicStars />

      {/* Mosque silhouette */}
      <MosqueSilhouette />

      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(251,191,36,0.5), transparent)" }} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center pt-7 pb-4 px-5">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
          className="mb-3"
        >
          <div
            className="w-[68px] h-[68px] rounded-full overflow-hidden"
            style={{
              border: "2.5px solid rgba(251,191,36,0.55)",
              boxShadow: "0 0 22px rgba(251,191,36,0.35), 0 0 44px rgba(251,191,36,0.15), 0 4px 20px rgba(0,0,0,0.4)",
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
          className="text-[17px] font-bold tracking-wide"
          style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.4)" }}
        >
          دليل التوبة النصوح
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-[11px] mt-1 mb-4 flex items-center gap-2"
          style={{ color: "rgba(200,230,210,0.6)" }}
        >
          <span className="inline-block w-8 h-px" style={{ background: "rgba(251,191,36,0.35)" }} />
          رحلتك نحو الله تبدأ هنا
          <span className="inline-block w-8 h-px" style={{ background: "rgba(251,191,36,0.35)" }} />
        </motion.p>

        {/* Content card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(251,191,36,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(251,191,36,0.12)" }}
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
                    {/* Badge + source */}
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

                    {/* Text */}
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
                      background: i === idx ? "#fbbf24" : "rgba(251,191,36,0.25)",
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
