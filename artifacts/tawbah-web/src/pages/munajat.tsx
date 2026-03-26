import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

// ─── Verses ──────────────────────────────────────────────────────────────────

const MUNAJAT_VERSES = [
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "الرعد: ٢٨" },
  { text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", ref: "البقرة: ١٨٦" },
  { text: "فَاذْكُرُونِي أَذْكُرْكُمْ", ref: "البقرة: ١٥٢" },
  { text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", ref: "الحديد: ٤" },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ref: "البقرة: ١٥٣" },
  { text: "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ", ref: "الأعراف: ١٥٦" },
];

const DHIKR_OPTIONS = [
  { text: "سُبْحَانَ اللَّه",   sub: "Subhanallah",    color: "#34d399", glow: "rgba(52,211,153,0.3)" },
  { text: "الْحَمْدُ لِلَّه",  sub: "Alhamdulillah",  color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { text: "اللَّهُ أَكْبَر",    sub: "Allahu Akbar",   color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
  { text: "أَسْتَغْفِرُ اللَّه",sub: "Astaghfirullah", color: "#f472b6", glow: "rgba(244,114,182,0.3)" },
];

const STARS = Array.from({ length: 50 }).map((_, i) => ({
  x: (i * 29 + 7) % 100,
  y: (i * 19 + 5) % 100,
  size: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.1,
  dur: 2.5 + (i % 6),
  delay: (i * 0.22) % 3.5,
  color: i % 5 === 0 ? "#c4b5fd" : i % 7 === 0 ? "#93c5fd" : "#ffffff",
}));

// ─── Shooting Stars ───────────────────────────────────────────────────────────

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  brightness: number;
}

function useShootingStars() {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const spawn = () => {
      const id = Date.now() + Math.random();
      const star: ShootingStar = {
        id,
        x: 15 + Math.random() * 70,
        y: 2 + Math.random() * 40,
        length: 60 + Math.random() * 120,
        angle: 25 + Math.random() * 20,
        speed: 0.9 + Math.random() * 0.8,
        brightness: 0.6 + Math.random() * 0.4,
      };
      setStars(prev => [...prev, star]);
      setTimeout(() => setStars(prev => prev.filter(s => s.id !== id)), (star.speed + 0.5) * 1000);
      timeoutRef.current = setTimeout(spawn, 2500 + Math.random() * 4500);
    };

    timeoutRef.current = setTimeout(spawn, 800 + Math.random() * 2000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return stars;
}

function ShootingStarEl({ star }: { star: ShootingStar }) {
  const rad = (star.angle * Math.PI) / 180;
  const dist = Math.max(window.innerWidth, 800) * 1.2;
  const tx = Math.cos(rad) * dist;
  const ty = Math.sin(rad) * dist;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.length,
        height: 1.5,
        borderRadius: 4,
        background: `linear-gradient(to left, rgba(255,255,255,${star.brightness}), rgba(200,200,255,0.4), transparent)`,
        rotate: star.angle,
        transformOrigin: "right center",
        filter: "blur(0.6px)",
        zIndex: 5,
      }}
      initial={{ x: -star.length, y: 0, opacity: 0, scaleX: 0.3 }}
      animate={{ x: tx, y: ty, opacity: [0, star.brightness, star.brightness * 0.8, 0], scaleX: [0.3, 1, 1, 1] }}
      transition={{ duration: star.speed, ease: "easeIn", times: [0, 0.06, 0.85, 1] }}
    />
  );
}

// ─── Procedural Sound Engine ──────────────────────────────────────────────────

type SoundId =
  | "none" | "rain" | "wind" | "river" | "ocean"
  | "birds" | "nightingale" | "night"
  | "crystal" | "flute" | "binaural" | "space";

interface SoundDef { id: SoundId; label: string; emoji: string; group: "nature" | "birds" | "relax"; }

const SOUND_LIST: SoundDef[] = [
  { id: "none",        label: "صامت",       emoji: "🔇", group: "nature" },
  { id: "rain",        label: "مطر",        emoji: "🌧️", group: "nature" },
  { id: "wind",        label: "نسيم",       emoji: "🍃", group: "nature" },
  { id: "river",       label: "نهر",        emoji: "💧", group: "nature" },
  { id: "ocean",       label: "أمواج",      emoji: "🌊", group: "nature" },
  { id: "birds",       label: "طيور",       emoji: "🐦", group: "birds"  },
  { id: "nightingale", label: "بلبل",       emoji: "🎵", group: "birds"  },
  { id: "night",       label: "ليل ساكن",  emoji: "🌙", group: "birds"  },
  { id: "crystal",     label: "كريستال",    emoji: "🔮", group: "relax"  },
  { id: "flute",       label: "ناي",        emoji: "🎶", group: "relax"  },
  { id: "binaural",    label: "تأمل",       emoji: "🧘", group: "relax"  },
  { id: "space",       label: "فضاء",       emoji: "✨", group: "relax"  },
];

function mkNoise(ctx: AudioContext): AudioBuffer {
  const sz = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
  for (let i=0;i<sz;i++) {
    const w = Math.random()*2-1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
  }
  return buf;
}

class ProceduralEngine {
  private ctx: AudioContext | null = null;
  private mg: GainNode | null = null;
  private cleanups: Array<() => void> = [];
  private vol = 0.5;

  private boot(): { ctx: AudioContext; mg: GainNode } {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.mg = this.ctx.createGain();
      this.mg.gain.value = this.vol;
      this.mg.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return { ctx: this.ctx, mg: this.mg! };
  }

  setVol(v: number) {
    this.vol = v;
    if (this.mg && this.ctx) this.mg.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08);
  }

  private noise(ctx: AudioContext, mg: GainNode, cfg: {
    filterType?: BiquadFilterType; freq?: number; Q?: number;
    gain?: number; lfoFreq?: number; lfoDepth?: number;
  }): () => void {
    const buf = mkNoise(ctx);
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = cfg.filterType ?? "lowpass";
    f.frequency.value = cfg.freq ?? 400; f.Q.value = cfg.Q ?? 0.5;
    const g = ctx.createGain(); g.gain.value = cfg.gain ?? 0.3;
    src.connect(f); f.connect(g); g.connect(mg);
    const stoppers: Array<() => void> = [];
    if (cfg.lfoFreq) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.lfoFreq;
      const lg = ctx.createGain(); lg.gain.value = cfg.lfoDepth ?? 100;
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      stoppers.push(() => { try { lfo.stop(); } catch {} });
    }
    src.start();
    return () => { try { src.stop(); } catch {} stoppers.forEach(fn => fn()); g.disconnect(); };
  }

  private birds(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const chirp = (t: number, freq: number, dur: number, vol: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 1.6, t + dur * 0.4);
      o.frequency.exponentialRampToValueAtTime(freq * 0.85, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + dur + 0.02);
    };
    const schedule = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const d = Math.random() * 1.5;
        const f = 700 + Math.random() * 1400;
        const reps = 2 + Math.floor(Math.random() * 5);
        for (let j = 0; j < reps; j++) chirp(now + d + j * (0.08 + Math.random() * 0.06), f + j * 40, 0.07 + Math.random() * 0.06, 0.055);
      }
      setTimeout(schedule, 1800 + Math.random() * 3500);
    };
    schedule();
    return () => { alive = false; };
  }

  private nightingale(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const SEQS = [
      [1100, 1300, 1000, 1200, 900, 1100],
      [1300, 1100, 1500, 1200, 1400],
      [900, 1100, 1300, 1000, 1200, 800],
    ];
    const sing = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const seq = SEQS[Math.floor(Math.random() * SEQS.length)]!;
      let t = now + Math.random() * 0.5;
      seq.forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const vib = ctx.createOscillator(); const vg = ctx.createGain();
        vib.frequency.value = 5 + Math.random() * 3; vg.gain.value = freq * 0.025;
        vib.connect(vg); vg.connect(o.frequency);
        o.type = "sine"; o.frequency.value = freq;
        const dur = 0.09 + Math.random() * 0.06;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.065, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(mg); o.start(t); vib.start(t);
        o.stop(t + dur + 0.02); vib.stop(t + dur + 0.02);
        t += dur + 0.04 + Math.random() * 0.04;
        void i;
      });
      setTimeout(sing, 2000 + Math.random() * 4000);
    };
    sing();
    return () => { alive = false; };
  }

  private night(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const cricket = (t: number, baseFreq: number) => {
      const reps = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < reps; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "square"; o.frequency.value = baseFreq + Math.random() * 200;
        const on = t + i * 0.04;
        g.gain.setValueAtTime(0, on);
        g.gain.linearRampToValueAtTime(0.018, on + 0.005);
        g.gain.linearRampToValueAtTime(0, on + 0.035);
        o.connect(g); g.connect(mg); o.start(on); o.stop(on + 0.04);
      }
    };
    const schedule = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const n = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) cricket(now + Math.random() * 1.5, 3500 + Math.random() * 1000);
      setTimeout(schedule, 800 + Math.random() * 1200);
    };
    schedule();
    return () => { alive = false; };
  }

  private crystal(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const FREQS = [256, 288, 341, 384, 512, 640];
    const ring = (freq: number, vol: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      o.connect(g); g.connect(mg); o.start(now); o.stop(now + 4.5);
    };
    const schedule = () => {
      if (!alive) return;
      const f = FREQS[Math.floor(Math.random() * FREQS.length)]!;
      ring(f, 0.07); ring(f * 2, 0.025); ring(f * 3, 0.012);
      setTimeout(schedule, 2500 + Math.random() * 3000);
    };
    schedule();
    return () => { alive = false; };
  }

  private flute(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const NOTES = [349, 392, 440, 493, 523, 587];
    const play = (freq: number, dur: number, vol: number, t: number) => {
      const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      const trem = ctx.createOscillator(); const tg = ctx.createGain();
      trem.frequency.value = 5.5; tg.gain.value = 0.012;
      trem.connect(tg); tg.connect(g.gain);
      o.type = "sine"; o.frequency.value = freq;
      o2.type = "sine"; o2.frequency.value = freq * 2; // 2nd harmonic
      const g2 = ctx.createGain(); g2.gain.value = 0.08;
      o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.06);
      g.gain.setValueAtTime(vol, t + dur - 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(mg);
      o.start(t); o2.start(t); trem.start(t);
      o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); trem.stop(t + dur + 0.05);
    };
    const phrase = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const len = 2 + Math.floor(Math.random() * 4);
      let t = now;
      for (let i = 0; i < len; i++) {
        const f = NOTES[Math.floor(Math.random() * NOTES.length)]!;
        const dur = 0.5 + Math.random() * 1.5;
        play(f, dur, 0.055, t);
        t += dur + 0.05 + Math.random() * 0.3;
      }
      setTimeout(phrase, (t - ctx.currentTime) * 1000 + 800 + Math.random() * 2000);
    };
    phrase();
    return () => { alive = false; };
  }

  private binaural(ctx: AudioContext, mg: GainNode): () => void {
    const base = 136; // earth frequency
    const beat = 10;  // alpha wave
    const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
    const g1 = ctx.createGain(); const g2 = ctx.createGain();
    o1.frequency.value = base; o2.frequency.value = base + beat;
    o1.type = "sine"; o2.type = "sine";
    g1.gain.value = 0.08; g2.gain.value = 0.08;
    o1.connect(g1); o2.connect(g2);
    g1.connect(mg); g2.connect(mg);

    // Low hum base
    const hum = ctx.createOscillator(); const hg = ctx.createGain();
    hum.frequency.value = base * 0.5; hg.gain.value = 0.04;
    hum.type = "sine"; hum.connect(hg); hg.connect(mg);

    o1.start(); o2.start(); hum.start();
    return () => {
      try { o1.stop(); o2.stop(); hum.stop(); } catch {}
      g1.disconnect(); g2.disconnect(); hg.disconnect();
    };
  }

  private space(ctx: AudioContext, mg: GainNode): () => void {
    // Deep drone + shimmer
    const noise1 = this.noise(ctx, mg, { filterType: "lowpass", freq: 120, Q: 0.3, gain: 0.18 });
    let alive = true;

    const shimmer = () => {
      if (!alive) return;
      const freq = 2000 + Math.random() * 5000;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.018, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      o.connect(g); g.connect(mg); o.start(now); o.stop(now + 1.6);
      setTimeout(shimmer, 600 + Math.random() * 2000);
    };
    shimmer();
    return () => { alive = false; noise1(); };
  }

  play(id: SoundId) {
    this.stop();
    if (id === "none") return;
    const { ctx, mg } = this.boot();

    let cleanup: (() => void) | null = null;
    switch (id) {
      case "rain":        cleanup = this.noise(ctx, mg, { filterType: "lowpass",  freq: 420, Q: 0.4, gain: 0.32 }); break;
      case "wind":        cleanup = this.noise(ctx, mg, { filterType: "bandpass", freq: 310, Q: 0.9, gain: 0.26, lfoFreq: 0.09, lfoDepth: 130 }); break;
      case "river": {
        const a = this.noise(ctx, mg, { filterType: "bandpass", freq: 600, Q: 1.2, gain: 0.18 });
        const b = this.noise(ctx, mg, { filterType: "lowpass",  freq: 900, gain: 0.12 });
        cleanup = () => { a(); b(); }; break;
      }
      case "ocean":       cleanup = this.noise(ctx, mg, { filterType: "lowpass",  freq: 500, Q: 0.5, gain: 0.28, lfoFreq: 0.11, lfoDepth: 250 }); break;
      case "birds":       cleanup = this.birds(ctx, mg); break;
      case "nightingale": cleanup = this.nightingale(ctx, mg); break;
      case "night":       cleanup = this.night(ctx, mg); break;
      case "crystal":     cleanup = this.crystal(ctx, mg); break;
      case "flute":       cleanup = this.flute(ctx, mg); break;
      case "binaural":    cleanup = this.binaural(ctx, mg); break;
      case "space":       cleanup = this.space(ctx, mg); break;
    }
    if (cleanup) this.cleanups = [cleanup];
  }

  stop() {
    this.cleanups.forEach(fn => { try { fn(); } catch {} });
    this.cleanups = [];
  }
}

const engine = new ProceduralEngine();

// ─── Sound Picker ─────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  nature: "🌿 طبيعة",
  birds:  "🐦 أصوات",
  relax:  "🧘 تأمل",
};

function SoundPicker({ active, onSelect, vol, onVol }: {
  active: SoundId;
  onSelect: (id: SoundId) => void;
  vol: number;
  onVol: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeDef = SOUND_LIST.find(s => s.id === active)!;

  const groups = ["nature", "birds", "relax"] as const;

  return (
    <div className="mx-4 mb-2">
      {/* Collapsed bar */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all"
        style={{
          background: active !== "none" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${active !== "none" ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        <div className="flex items-center gap-2">
          {active === "none"
            ? <VolumeX size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
            : <Volume2 size={14} style={{ color: "#a78bfa" }} />}
          <span className="text-[11px] font-bold" style={{ color: active !== "none" ? "#c4b5fd" : "rgba(255,255,255,0.5)" }}>
            {active !== "none" ? `${activeDef.emoji} ${activeDef.label} — جارٍ التشغيل` : "الأصوات المحيطة — اختر صوتاً"}
          </span>
          {active !== "none" && (
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }} />
          )}
        </div>
        {open ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
               : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)" }} />}
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 px-3 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* none button */}
              <button
                onClick={() => { onSelect("none"); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-2 transition-all"
                style={{
                  background: active === "none" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active === "none" ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <span style={{ fontSize: 16 }}>🔇</span>
                <span className="text-[11px] font-bold" style={{ color: active === "none" ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}>صامت</span>
              </button>

              {/* Grouped rows */}
              {groups.map(group => {
                const items = SOUND_LIST.filter(s => s.group === group);
                return (
                  <div key={group} className="mb-2">
                    <p className="text-[9px] font-bold mb-1.5 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {GROUP_LABELS[group]}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {items.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { onSelect(s.id); setOpen(false); }}
                          className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                          style={{
                            background: active === s.id
                              ? "linear-gradient(135deg, rgba(167,139,250,0.35) 0%, rgba(139,92,246,0.2) 100%)"
                              : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active === s.id ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.07)"}`,
                            boxShadow: active === s.id ? "0 0 12px rgba(167,139,250,0.3)" : "none",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{s.emoji}</span>
                          <span className="text-[8.5px] text-center leading-tight"
                            style={{ color: active === s.id ? "#c4b5fd" : "rgba(255,255,255,0.38)" }}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Volume */}
              {active !== "none" && (
                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <VolumeX size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="range" min={0} max={1} step={0.05} value={vol}
                    onChange={e => onVol(parseFloat(e.target.value))}
                    className="flex-1 h-1" style={{ accentColor: "#a78bfa" }}
                  />
                  <Volume2 size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Munajat() {
  const [count, setCount] = useState(0);
  const [activeDhikr, setActiveDhikr] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [activeSound, setActiveSound] = useState<SoundId>("none");
  const [volume, setVolume] = useState(0.5);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const dhikr = DHIKR_OPTIONS[activeDhikr]!;
  const verse = MUNAJAT_VERSES[verseIdx]!;
  const shootingStars = useShootingStars();

  useEffect(() => {
    const t = setInterval(() => setVerseIdx(i => (i + 1) % MUNAJAT_VERSES.length), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { return () => { engine.stop(); }; }, []);

  const handleSoundSelect = (id: SoundId) => {
    engine.play(id);
    setActiveSound(id);
  };

  const handleVol = (v: number) => { setVolume(v); engine.setVol(v); };

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setCount(c => c + 1);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);
  }, []);

  const isNight = new Date().getHours() >= 20 || new Date().getHours() < 4;

  return (
    <div
      className="min-h-screen flex flex-col select-none overflow-hidden"
      style={{ background: "linear-gradient(160deg, #04020f 0%, #0c0a1e 40%, #0d0520 100%)" }}
    >
      {/* Fixed stars BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {STARS.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, background: s.color }}
            animate={{ opacity: [0.06, 0.5, 0.06] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
          />
        ))}

        {/* Shooting stars */}
        <AnimatePresence>
          {shootingStars.map(star => (
            <ShootingStarEl key={star.id} star={star} />
          ))}
        </AnimatePresence>

        {/* Nebula glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 40% at 20% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 30% at 80% 70%, rgba(59,130,246,0.05) 0%, transparent 70%)",
        }} />
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
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {isNight ? "وقت المناجاة — الليل خيرٌ وبركة" : "تواصل مع الله في كل حين"}
          </p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Sound picker */}
      <div className="relative z-10">
        <SoundPicker active={activeSound} onSelect={handleSoundSelect} vol={volume} onVol={handleVol} />
      </div>

      {/* Verse */}
      <div className="relative z-10 px-5 mb-2">
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
              style={{ fontFamily: "'Amiri Quran', serif", fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
              ﴿{verse.text}﴾
            </p>
            <p style={{ fontSize: 10, color: "rgba(200,180,255,0.45)" }}>{verse.ref}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main dhikr tap area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-4">

        {/* Tap circle */}
        <motion.button
          onClick={handleTap}
          className="relative overflow-hidden w-[158px] h-[158px] rounded-full flex flex-col items-center justify-center gap-2"
          style={{
            background: `radial-gradient(circle, ${dhikr.glow} 0%, rgba(0,0,0,0) 70%)`,
            border: `2px solid ${dhikr.color}44`,
            boxShadow: `0 0 40px ${dhikr.glow}, 0 0 80px ${dhikr.glow}40`,
          }}
          whileTap={{ scale: 0.92 }}
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
            transition={{ duration: 0.18 }}
            className="relative font-bold tabular-nums leading-none"
            style={{ fontSize: 38, color: dhikr.color }}
          >
            {count}
          </motion.p>
          <p className="relative text-[13px] font-bold leading-snug text-center px-4"
            style={{ color: "rgba(255,255,255,0.82)", fontFamily: "'Amiri Quran', serif" }}>
            {dhikr.text}
          </p>
          <p className="relative text-[10px]" style={{ color: `${dhikr.color}80` }}>{dhikr.sub}</p>
        </motion.button>

        {/* Milestones */}
        <div className="flex gap-3">
          {[33, 66, 99].map(n => (
            <div
              key={n}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
              style={{
                background: count >= n ? `${dhikr.color}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${count >= n ? dhikr.color + "55" : "rgba(255,255,255,0.09)"}`,
                color: count >= n ? dhikr.color : "rgba(255,255,255,0.2)",
                boxShadow: count >= n ? `0 0 10px ${dhikr.color}30` : "none",
              }}
            >
              {count >= n ? "✓" : n}
            </div>
          ))}
        </div>

        {count > 0 && (
          <button onClick={() => setCount(0)}
            className="text-[11px] px-4 py-1.5 rounded-full transition-all"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
                border: `1px solid ${activeDhikr === i ? d.color + "60" : "rgba(255,255,255,0.09)"}`,
                color: activeDhikr === i ? d.color : "rgba(255,255,255,0.4)",
              }}
            >
              {d.text}
            </button>
          ))}
        </div>
      </div>

      <div className="h-8 relative z-10" />
    </div>
  );
}
