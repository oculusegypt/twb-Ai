import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Music, Volume2, VolumeX, Volume1 } from "lucide-react";
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

// ─── Ambient Sound Engine ─────────────────────────────────────────────────────

type SoundId = "none" | "rain" | "wind" | "river" | "birds" | "nightingale" | "ocean" | "forest";

interface SoundDef {
  id: SoundId;
  label: string;
  emoji: string;
  type: "procedural" | "url";
  url?: string;
}

const SOUNDS: SoundDef[] = [
  { id: "none",        label: "صامت",        emoji: "🔇", type: "procedural" },
  { id: "rain",        label: "صوت المطر",   emoji: "🌧️", type: "procedural" },
  { id: "wind",        label: "نسيم خفيف",   emoji: "🍃", type: "procedural" },
  { id: "river",       label: "خرير نهر",    emoji: "💧", type: "procedural" },
  { id: "birds",       label: "طيور الفجر",  emoji: "🐦", type: "url",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { id: "nightingale", label: "صفير بلبل",   emoji: "🎵", type: "url",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_0427e0048d.mp3" },
  { id: "ocean",       label: "أمواج البحر", emoji: "🌊", type: "url",
    url: "https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bea40e.mp3" },
  { id: "forest",      label: "أصوات الغابة",emoji: "🌲", type: "url",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_3fa8dd0af3.mp3" },
];

function createNoiseBuf(ctx: AudioContext): AudioBuffer {
  const sz = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stoppers: (() => void)[] = [];
  private audioEl: HTMLAudioElement | null = null;
  private vol = 0.5;

  private ensureCtx(): { ctx: AudioContext; mg: GainNode } {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.vol;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return { ctx: this.ctx, mg: this.masterGain! };
  }

  setVolume(v: number) {
    this.vol = v;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.1);
    if (this.audioEl) this.audioEl.volume = v;
  }

  private stopAll() {
    this.stoppers.forEach(fn => { try { fn(); } catch {} });
    this.stoppers = [];
    if (this.audioEl) { this.audioEl.pause(); this.audioEl.src = ""; this.audioEl = null; }
  }

  play(sound: SoundDef) {
    this.stopAll();
    if (sound.id === "none") return;

    if (sound.type === "url" && sound.url) {
      const el = new Audio(sound.url);
      el.loop = true;
      el.volume = this.vol;
      el.play().catch(() => {});
      this.audioEl = el;
      return;
    }

    const { ctx, mg } = this.ensureCtx();
    const noiseBuf = createNoiseBuf(ctx);

    const makeNoise = (): AudioBufferSourceNode => {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf;
      s.loop = true;
      return s;
    };

    if (sound.id === "rain") {
      const n = makeNoise();
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 400; f.Q.value = 0.4;
      const g = ctx.createGain(); g.gain.value = 0.35;
      n.connect(f); f.connect(g); g.connect(mg);
      n.start();
      this.stoppers = [() => { n.stop(); n.disconnect(); f.disconnect(); g.disconnect(); }];

    } else if (sound.id === "wind") {
      const n = makeNoise();
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 300; f.Q.value = 0.9;
      const lfo = ctx.createOscillator();
      lfo.type = "sine"; lfo.frequency.value = 0.08;
      const lg = ctx.createGain(); lg.gain.value = 130;
      lfo.connect(lg); lg.connect(f.frequency);
      const g = ctx.createGain(); g.gain.value = 0.28;
      n.connect(f); f.connect(g); g.connect(mg);
      n.start(); lfo.start();
      this.stoppers = [() => { try { n.stop(); lfo.stop(); } catch {} n.disconnect(); f.disconnect(); g.disconnect(); lg.disconnect(); }];

    } else if (sound.id === "river") {
      const n1 = makeNoise(); const n2 = makeNoise();
      const f1 = ctx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 600; f1.Q.value = 1.2;
      const f2 = ctx.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = 800;
      const g = ctx.createGain(); g.gain.value = 0.28;
      n1.connect(f1); n2.connect(f2); f1.connect(g); f2.connect(g); g.connect(mg);
      n1.start(); n2.start();
      this.stoppers = [() => { try { n1.stop(); n2.stop(); } catch {} g.disconnect(); }];
    }
  }

  stop() { this.stopAll(); }
}

const soundEngine = new SoundEngine();

// ─── Component ────────────────────────────────────────────────────────────────

export default function Munajat() {
  const [count, setCount] = useState(0);
  const [activeDhikr, setActiveDhikr] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [activeSound, setActiveSound] = useState<SoundId>("none");
  const [volume, setVolume] = useState(0.5);
  const [showSoundPanel, setShowSoundPanel] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const dhikr = DHIKR_OPTIONS[activeDhikr]!;
  const verse = MUNAJAT_VERSES[verseIdx]!;

  useEffect(() => {
    const t = setInterval(() => setVerseIdx(i => (i + 1) % MUNAJAT_VERSES.length), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { return () => { soundEngine.stop(); }; }, []);

  const handleSoundSelect = (id: SoundId) => {
    const def = SOUNDS.find(s => s.id === id)!;
    soundEngine.play(def);
    setActiveSound(id);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundEngine.setVolume(v);
  };

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setCount(c => c + 1);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);
  }, []);

  const activeDef = SOUNDS.find(s => s.id === activeSound)!;

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
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </Link>
        <div className="text-center">
          <h1 className="font-bold text-base" style={{ color: "rgba(255,255,255,0.9)" }}>وضع المناجاة 🌙</h1>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {new Date().getHours() >= 20 || new Date().getHours() < 4 ? "وقت المناجاة — الليل خيرٌ وبركة" : "تواصل مع الله في كل حين"}
          </p>
        </div>
        <button
          onClick={() => setShowSoundPanel(v => !v)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: activeSound !== "none" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.08)",
            border: activeSound !== "none" ? "1px solid rgba(167,139,250,0.4)" : "1px solid transparent",
          }}
        >
          {activeSound === "none"
            ? <VolumeX size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
            : <Volume2 size={16} style={{ color: "#a78bfa" }} />}
        </button>
      </div>

      {/* Sound panel */}
      <AnimatePresence>
        {showSoundPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 overflow-hidden mx-4 mb-2"
          >
            <div className="py-3 px-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>

              <div className="flex items-center gap-2 mb-3">
                <Music size={12} style={{ color: "#a78bfa" }} />
                <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.65)" }}>
                  الأصوات المحيطة — {activeDef.emoji} {activeDef.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {SOUNDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSoundSelect(s.id)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all"
                    style={{
                      background: activeSound === s.id
                        ? "linear-gradient(135deg, rgba(167,139,250,0.3) 0%, rgba(139,92,246,0.15) 100%)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${activeSound === s.id ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>
                    <span className="text-[8px] text-center leading-tight"
                      style={{ color: activeSound === s.id ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
                      {s.label}
                    </span>
                    {activeSound === s.id && s.id !== "none" && (
                      <motion.div className="w-1 h-1 rounded-full" style={{ background: "#a78bfa" }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }} />
                    )}
                  </button>
                ))}
              </div>

              {activeSound !== "none" && (
                <div className="flex items-center gap-2">
                  <VolumeX size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
                  <input
                    type="range" min={0} max={1} step={0.05} value={volume}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1"
                    style={{ accentColor: "#a78bfa" }}
                  />
                  <Volume1 size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verse */}
      <div className="relative z-10 px-5 mt-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={verseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="py-3 px-4 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="leading-loose mb-1"
              style={{ fontFamily: "'Amiri Quran', serif", fontSize: 15, color: "rgba(255,255,255,0.88)" }}>
              ﴿{verse.text}﴾
            </p>
            <p style={{ fontSize: 10, color: "rgba(200,180,255,0.45)" }}>{verse.ref}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main dhikr area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-4 mt-4">

        {/* Tap button */}
        <motion.button
          onClick={handleTap}
          className="relative overflow-hidden w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center gap-2"
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
              animate={{ width: 320, height: 320, opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          ))}
          <motion.p
            key={count}
            initial={{ scale: 1.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative font-bold tabular-nums leading-none"
            style={{ fontSize: 38, color: dhikr.color }}
          >
            {count}
          </motion.p>
          <p className="relative text-[13px] font-bold leading-snug text-center px-4"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Amiri Quran', serif" }}>
            {dhikr.text}
          </p>
          <p className="relative text-[10px]" style={{ color: `${dhikr.color}80` }}>{dhikr.sub}</p>
        </motion.button>

        {/* Milestones */}
        <div className="flex gap-3">
          {[33, 66, 99].map(n => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: count >= n ? `${dhikr.color}25` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${count >= n ? dhikr.color + "55" : "rgba(255,255,255,0.1)"}`,
                  color: count >= n ? dhikr.color : "rgba(255,255,255,0.2)",
                }}
              >
                {count >= n ? "✓" : n}
              </div>
            </div>
          ))}
        </div>

        {count > 0 && (
          <button onClick={() => setCount(0)} className="text-[11px] px-4 py-1.5 rounded-full"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.09)" }}>
            إعادة العدّ
          </button>
        )}

        {/* Dhikr switcher */}
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

      <div className="h-8" />
    </div>
  );
}
