import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";
import { voicePending } from "@/lib/voice-pending";

const NUM_BARS = 32;

const IDLE_HEIGHTS = Array.from({ length: NUM_BARS }, (_, i) => {
  const x = i / (NUM_BARS - 1);
  const bell = Math.exp(-Math.pow((x - 0.5) * 3.5, 2));
  return 0.06 + bell * 0.22;
});

const BAR_COLORS = Array.from({ length: NUM_BARS }, (_, i) => {
  const t = i / (NUM_BARS - 1);
  if (t < 0.25) return `hsl(${250 + t * 40}, 90%, 68%)`;
  if (t < 0.5)  return `hsl(${200 + t * 30}, 95%, 65%)`;
  if (t < 0.75) return `hsl(${175 + t * 20}, 95%, 60%)`;
  return `hsl(${240 + t * 40}, 88%, 68%)`;
});

const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function VoiceOrbOverlay({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [bars, setBars] = useState<number[]>(IDLE_HEIGHTS);
  const [phase, setPhase] = useState<"entering" | "listening" | "done">("entering");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");

  const recognitionRef = useRef<any>(null);
  const capturedTextRef = useRef("");
  const barAnimRef = useRef<number>(0);
  const listeningRef = useRef(false);

  const stopBarAnim = useCallback(() => {
    listeningRef.current = false;
    cancelAnimationFrame(barAnimRef.current);
  }, []);

  const startBarAnim = useCallback(() => {
    listeningRef.current = true;
    const tick = () => {
      if (!listeningRef.current) return;
      setBars((prev) =>
        prev.map((h, i) => {
          const center = NUM_BARS / 2;
          const dist = Math.abs(i - center) / center;
          const maxH = 0.85 - dist * 0.3;
          const speed = 0.5 - dist * 0.18;
          const delta = (Math.random() - 0.5) * speed;
          return Math.max(0.04, Math.min(maxH, h + delta));
        })
      );
      barAnimRef.current = requestAnimationFrame(tick);
    };
    barAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const finishAndNavigate = useCallback((text: string) => {
    stopBarAnim();
    setBars(IDLE_HEIGHTS);
    setPhase("done");
    const trimmed = text.trim();
    if (trimmed) {
      voicePending.set(trimmed);
      localStorage.setItem("zakiy_voice_input", trimmed);
    }
    setTimeout(() => {
      navigate("/zakiy");
      onClose();
      if (trimmed) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("zakiy:voice-input", { detail: trimmed }));
        }, 750);
      }
    }, 380);
  }, [stopBarAnim, navigate, onClose]);

  const startListening = useCallback(() => {
    setPhase("listening");
    startBarAnim();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      finishAndNavigate("");
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        capturedTextRef.current = final.trim();
        setFinalText(final.trim());
        setInterimText("");
      }
    };
    recognition.onend = () => finishAndNavigate(capturedTextRef.current);
    recognition.onerror = () => finishAndNavigate(capturedTextRef.current);
    recognition.start();
  }, [startBarAnim, finishAndNavigate]);

  useEffect(() => {
    const t = setTimeout(startListening, 520);
    return () => clearTimeout(t);
  }, [startListening]);

  useEffect(() => {
    return () => {
      stopBarAnim();
      recognitionRef.current?.abort();
    };
  }, [stopBarAnim]);

  const displayText = finalText || interimText;
  const isListening = phase === "listening";

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: "radial-gradient(ellipse at 50% 60%, rgba(10,8,28,0.97) 0%, rgba(2,4,16,0.99) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
      onClick={onClose}
    >
      {/* ── Ambient background aurora ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(99,102,241,0.07), rgba(6,182,212,0.09), rgba(168,85,247,0.07), rgba(236,72,153,0.06), rgba(99,102,241,0.07))",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      {/* ── Subtle grid lines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      <div
        className="flex flex-col items-center gap-8 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Waveform Visualizer ── */}
        <div className="flex flex-col items-center gap-0" style={{ height: 80 }}>
          {/* mirror top */}
          <div className="flex items-end justify-center gap-[3px]" style={{ height: 40 }}>
            {bars.map((h, i) => {
              const barH = Math.max(3, h * 40);
              return (
                <motion.div
                  key={`top-${i}`}
                  animate={{ height: barH }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  style={{
                    width: i % 4 === 0 ? 4 : i % 2 === 0 ? 3 : 2.5,
                    borderRadius: "3px 3px 1px 1px",
                    flexShrink: 0,
                    background: isListening
                      ? `linear-gradient(to top, ${BAR_COLORS[i]}, ${BAR_COLORS[i]?.replace(/68%|65%|60%/, "88%")})`
                      : "rgba(255,255,255,0.12)",
                    boxShadow: isListening && barH > 20
                      ? `0 0 6px 1px ${BAR_COLORS[i]}60`
                      : "none",
                    opacity: isListening ? 1 : 0.35,
                    transition: "opacity 0.4s ease, box-shadow 0.2s ease",
                  }}
                />
              );
            })}
          </div>
          {/* center divider line */}
          <div
            style={{
              width: "100%",
              height: 1,
              background: isListening
                ? "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(6,182,212,0.6), rgba(139,92,246,0.5), transparent)"
                : "rgba(255,255,255,0.06)",
              transition: "background 0.4s ease",
            }}
          />
          {/* mirror bottom */}
          <div className="flex items-start justify-center gap-[3px]" style={{ height: 39 }}>
            {bars.map((h, i) => {
              const barH = Math.max(3, h * 36);
              return (
                <motion.div
                  key={`bot-${i}`}
                  animate={{ height: barH }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  style={{
                    width: i % 4 === 0 ? 4 : i % 2 === 0 ? 3 : 2.5,
                    borderRadius: "1px 1px 3px 3px",
                    flexShrink: 0,
                    background: isListening
                      ? `linear-gradient(to bottom, ${BAR_COLORS[i]}, ${BAR_COLORS[i]?.replace(/68%|65%|60%/, "35%")})`
                      : "rgba(255,255,255,0.06)",
                    opacity: isListening ? 0.55 : 0.15,
                    transition: "opacity 0.4s ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── AI Mic Orb ── */}
        <motion.div
          initial={{ scale: 0.4, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 190, damping: 20 }}
          className="relative flex items-center justify-center"
          style={{ width: 156, height: 156 }}
        >
          {/* Outermost diffuse aurora glow */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -32,
              background:
                "conic-gradient(from 0deg, rgba(99,102,241,0.25), rgba(6,182,212,0.3), rgba(168,85,247,0.25), rgba(236,72,153,0.18), rgba(6,182,212,0.22), rgba(99,102,241,0.25))",
              filter: "blur(22px)",
              opacity: isListening ? 0.9 : 0.45,
              transition: "opacity 0.5s ease",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          />

          {/* Secondary focused glow ring */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -14,
              background:
                "conic-gradient(from 90deg, #6366f1, #06b6d4, #a855f7, #ec4899, #22d3ee, #6366f1)",
              filter: "blur(10px)",
              opacity: isListening ? 0.55 : 0.2,
              transition: "opacity 0.5s ease",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Spinning rainbow border */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -2.5,
              background:
                "conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #ec4899, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #6366f1)",
              padding: "2.5px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner glass sphere */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              inset: 2.5,
              background:
                "radial-gradient(circle at 38% 28%, rgba(255,255,255,0.06) 0%, rgba(8,6,24,0.97) 55%, rgba(4,3,16,0.99) 100%)",
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.8), inset 0 2px 8px rgba(255,255,255,0.04)",
            }}
          />

          {/* Inner color nebula pulse */}
          <motion.div
            className="absolute rounded-full"
            style={{ inset: 2.5 }}
            animate={{
              background: [
                "radial-gradient(circle at 42% 42%, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.15) 45%, transparent 70%)",
                "radial-gradient(circle at 58% 38%, rgba(168,85,247,0.35) 0%, rgba(236,72,153,0.15) 45%, transparent 70%)",
                "radial-gradient(circle at 46% 58%, rgba(6,182,212,0.35) 0%, rgba(99,102,241,0.15) 45%, transparent 70%)",
                "radial-gradient(circle at 54% 44%, rgba(236,72,153,0.28) 0%, rgba(168,85,247,0.15) 45%, transparent 70%)",
                "radial-gradient(circle at 42% 42%, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.15) 45%, transparent 70%)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Orbiting particles */}
          {PARTICLE_ANGLES.map((angle, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: idx % 2 === 0 ? 4 : 3,
                height: idx % 2 === 0 ? 4 : 3,
                background: [
                  "#818cf8", "#06b6d4", "#c084fc", "#fb7185",
                  "#34d399", "#fbbf24", "#60a5fa", "#e879f9",
                ][idx],
                boxShadow: `0 0 6px 2px ${["#818cf8", "#06b6d4", "#c084fc", "#fb7185", "#34d399", "#fbbf24", "#60a5fa", "#e879f9"][idx]}90`,
                top: "50%",
                left: "50%",
                marginTop: -2,
                marginLeft: -2,
                opacity: isListening ? 1 : 0.3,
                transition: "opacity 0.5s ease",
              }}
              animate={{
                x: [
                  Math.cos(((angle) * Math.PI) / 180) * 82,
                  Math.cos(((angle + 45) * Math.PI) / 180) * 86,
                  Math.cos(((angle + 90) * Math.PI) / 180) * 82,
                  Math.cos(((angle + 135) * Math.PI) / 180) * 86,
                  Math.cos(((angle + 180) * Math.PI) / 180) * 82,
                  Math.cos(((angle + 225) * Math.PI) / 180) * 86,
                  Math.cos(((angle + 270) * Math.PI) / 180) * 82,
                  Math.cos(((angle + 315) * Math.PI) / 180) * 86,
                  Math.cos(((angle + 360) * Math.PI) / 180) * 82,
                ],
                y: [
                  Math.sin(((angle) * Math.PI) / 180) * 82,
                  Math.sin(((angle + 45) * Math.PI) / 180) * 86,
                  Math.sin(((angle + 90) * Math.PI) / 180) * 82,
                  Math.sin(((angle + 135) * Math.PI) / 180) * 86,
                  Math.sin(((angle + 180) * Math.PI) / 180) * 82,
                  Math.sin(((angle + 225) * Math.PI) / 180) * 86,
                  Math.sin(((angle + 270) * Math.PI) / 180) * 82,
                  Math.sin(((angle + 315) * Math.PI) / 180) * 86,
                  Math.sin(((angle + 360) * Math.PI) / 180) * 82,
                ],
              }}
              transition={{
                duration: 6 + idx * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Mic icon */}
          <div className="relative z-10 flex items-center justify-center">
            <motion.div
              animate={isListening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mic
                size={54}
                strokeWidth={1.25}
                style={{
                  color: "transparent",
                  stroke: "url(#micGrad)",
                  filter: "drop-shadow(0 0 12px rgba(139,92,246,0.7)) drop-shadow(0 0 24px rgba(6,182,212,0.4))",
                }}
              />
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                  <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="40%" stopColor="#22d3ee" />
                    <stop offset="75%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>

          {/* Pulse ripple when listening */}
          {isListening && [0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute rounded-full border pointer-events-none"
              style={{
                inset: 0,
                borderColor: "rgba(139,92,246,0.35)",
                borderWidth: 1.5,
              }}
              animate={{ scale: [1, 1.6, 1.9], opacity: [0.6, 0.2, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>

        {/* ── Status label ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-col items-center gap-1.5"
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                background: isListening
                  ? "linear-gradient(90deg, #a5b4fc, #22d3ee, #c084fc)"
                  : "rgba(255,255,255,0.45)",
                WebkitBackgroundClip: isListening ? "text" : undefined,
                WebkitTextFillColor: isListening ? "transparent" : undefined,
                color: isListening ? undefined : "rgba(255,255,255,0.45)",
              }}
            >
              {phase === "entering"
                ? "جاري التجهيز..."
                : phase === "listening"
                ? "تحدث الآن..."
                : "جاري الإرسال..."}
            </p>

            {/* Animated dots when listening */}
            {isListening && (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      background: ["#818cf8", "#22d3ee", "#c084fc", "#22d3ee", "#818cf8"][i],
                    }}
                    animate={{ scaleY: [0.4, 1.4, 0.4], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Transcript text ── */}
        <AnimatePresence mode="wait">
          {displayText ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="max-w-[280px] text-center px-2"
            >
              <p
                style={{
                  fontSize: 14,
                  lineHeight: "1.65",
                  padding: "10px 18px",
                  borderRadius: 16,
                  color: finalText ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.5)",
                  background: finalText
                    ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(6,182,212,0.12))"
                    : "rgba(255,255,255,0.05)",
                  border: finalText
                    ? "1px solid rgba(139,92,246,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                  fontStyle: finalText ? "normal" : "italic",
                  boxShadow: finalText
                    ? "0 0 20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "none",
                }}
              >
                {displayText}
              </p>
            </motion.div>
          ) : phase === "listening" ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", fontStyle: "italic" }}>
                ما تقوله سيظهر هنا...
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Tap to close hint ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.28 }}
          transition={{ delay: 1.2 }}
          style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.05em" }}
        >
          اضغط للإغلاق
        </motion.p>
      </div>
    </motion.div>
  );
}
