import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";

const MUNAJAT_VERSES = [
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "الرعد: ٢٨" },
  { text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", ref: "البقرة: ١٨٦" },
  { text: "فَاذْكُرُونِي أَذْكُرْكُمْ", ref: "البقرة: ١٥٢" },
  { text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", ref: "الحديد: ٤" },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ref: "البقرة: ١٥٣" },
  { text: "وَبِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "الرعد: ٢٨" },
];

const DHIKR_OPTIONS = [
  { text: "سُبْحَانَ اللَّه", sub: "Subhanallah", color: "#34d399", glow: "rgba(52,211,153,0.3)" },
  { text: "الْحَمْدُ لِلَّه", sub: "Alhamdulillah", color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { text: "اللَّهُ أَكْبَر", sub: "Allahu Akbar", color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
  { text: "أَسْتَغْفِرُ اللَّه", sub: "Astaghfirullah", color: "#f472b6", glow: "rgba(244,114,182,0.3)" },
];

const STARS = Array.from({ length: 40 }).map((_, i) => ({
  x: (i * 31 + 7) % 100,
  y: (i * 17 + 5) % 100,
  size: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2,
  dur: 2.5 + (i % 5),
  delay: (i * 0.28) % 3,
}));

type SoundType = "none" | "rain" | "mecca";

export default function Munajat() {
  const [count, setCount] = useState(0);
  const [activeDhikr, setActiveDhikr] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [sound, setSound] = useState<SoundType>("none");
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 4;
  const dhikr = DHIKR_OPTIONS[activeDhikr]!;

  useEffect(() => {
    const t = setInterval(() => setVerseIdx(i => (i + 1) % MUNAJAT_VERSES.length), 8000);
    return () => clearInterval(t);
  }, []);

  const toggleSound = () => {
    const next: SoundType = sound === "none" ? "rain" : sound === "rain" ? "mecca" : "none";
    setSound(next);
  };

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setCount(c => c + 1);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);
  }, []);

  const resetCount = () => setCount(0);

  const verse = MUNAJAT_VERSES[verseIdx]!;

  const soundLabel = sound === "none" ? "صامت" : sound === "rain" ? "🌧 مطر" : "🕌 مكة";

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{ background: "linear-gradient(160deg, #04020f 0%, #0c0a1e 40%, #0d0520 100%)" }}
    >
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.08, 0.55, 0.08] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe-top pt-4 pb-2">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </Link>
        <div className="text-center">
          <h1 className="font-bold text-base" style={{ color: "rgba(255,255,255,0.9)" }}>
            وضع المناجاة 🌙
          </h1>
          {isNight && (
            <p className="text-[10px]" style={{ color: "rgba(200,180,255,0.55)" }}>وقت المناجاة — الليل خيرٌ وبركة</p>
          )}
        </div>
        <button
          onClick={toggleSound}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold gap-0.5"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        >
          {sound === "none" ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Sound badge */}
      {sound !== "none" && (
        <div className="relative z-10 flex justify-center mt-1">
          <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", color: "#c4b5fd" }}>
            {soundLabel} — جارٍ التشغيل
          </div>
        </div>
      )}

      {/* Verse */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="text-center px-4 py-5 rounded-[20px] w-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={verseIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-[16px] font-bold leading-loose text-center"
              style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Amiri Quran', serif" }}
            >
              ﴿{verse.text}﴾
            </motion.p>
          </AnimatePresence>
          <p className="text-[11px] mt-2" style={{ color: "rgba(200,180,255,0.5)" }}>{verse.ref}</p>
        </div>

        {/* Main dhikr tap button */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={handleTap}
            className="relative overflow-hidden w-[170px] h-[170px] rounded-full flex flex-col items-center justify-center gap-2"
            style={{
              background: `radial-gradient(circle, ${dhikr.glow} 0%, rgba(0,0,0,0) 70%)`,
              border: `2px solid ${dhikr.color}44`,
              boxShadow: `0 0 40px ${dhikr.glow}, 0 0 80px ${dhikr.glow}40`,
            }}
            whileTap={{ scale: 0.93 }}
          >
            {ripples.map(r => (
              <motion.div
                key={r.id}
                className="absolute rounded-full pointer-events-none"
                style={{ left: r.x, top: r.y, x: "-50%", y: "-50%", background: `${dhikr.color}30` }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 340, height: 340, opacity: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />
            ))}
            <motion.p
              key={count}
              initial={{ scale: 1.3, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative font-bold tabular-nums leading-none"
              style={{ fontSize: 42, color: dhikr.color }}
            >
              {count}
            </motion.p>
            <p className="relative text-[13px] font-bold leading-snug text-center px-4" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Amiri Quran', serif" }}>
              {dhikr.text}
            </p>
            <p className="relative text-[10px]" style={{ color: `${dhikr.color}80` }}>{dhikr.sub}</p>
          </motion.button>

          {count > 0 && (
            <button onClick={resetCount} className="text-[11px] px-4 py-1.5 rounded-full" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}>
              إعادة العدّ
            </button>
          )}
        </div>

        {/* Dhikr type switcher */}
        <div className="flex gap-2 flex-wrap justify-center w-full">
          {DHIKR_OPTIONS.map((d, i) => (
            <button
              key={i}
              onClick={() => { setActiveDhikr(i); setCount(0); }}
              className="px-3 py-2 rounded-[14px] text-[11px] font-bold transition-all"
              style={{
                background: activeDhikr === i ? `${d.color}22` : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeDhikr === i ? d.color + "60" : "rgba(255,255,255,0.1)"}`,
                color: activeDhikr === i ? d.color : "rgba(255,255,255,0.45)",
              }}
            >
              {d.text}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom safe area padding */}
      <div className="h-8" />
    </div>
  );
}
