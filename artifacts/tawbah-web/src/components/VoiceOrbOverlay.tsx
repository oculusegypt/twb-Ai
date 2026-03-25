import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";
import { voicePending } from "@/lib/voice-pending";

const NUM_BARS = 22;

const IDLE_HEIGHTS = [0.12, 0.18, 0.14, 0.22, 0.16, 0.20, 0.13, 0.19, 0.15, 0.21, 0.17, 0.23, 0.14, 0.18, 0.12, 0.20, 0.16, 0.22, 0.13, 0.19, 0.15, 0.17];

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
        prev.map((h) => {
          const delta = (Math.random() - 0.5) * 0.35;
          return Math.max(0.06, Math.min(1, h + delta));
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
      // Primary: module variable — immune to Strict Mode and timing issues
      voicePending.set(trimmed);
      // Backup: localStorage — for robustness
      localStorage.setItem("zakiy_voice_input", trimmed);
    }
    setTimeout(() => {
      navigate("/zakiy");
      onClose();
      // Dispatch event for the case when Zakiy is ALREADY mounted (same page).
      // Delay must exceed the full page transition: exit (300ms) + enter (300ms) + buffer.
      // If Zakiy was NOT yet mounted, the mount effect handles it via voicePending.
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
        if (e.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
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

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        background: "rgba(4, 10, 22, 0.88)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      onClick={onClose}
    >
      {/* Islamic geometric pattern overlay */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => {
            const cx = col * 110 + 55;
            const cy = row * 190 + 95;
            return (
              <g key={`${row}-${col}`} transform={`translate(${cx},${cy})`}>
                <polygon
                  points={Array.from({ length: 8 }, (_, i) => {
                    const a = i * 45;
                    const r1 = 38, r2 = 16;
                    const toRad = (d: number) => (d - 90) * Math.PI / 180;
                    return [
                      `${r1 * Math.cos(toRad(a))},${r1 * Math.sin(toRad(a))}`,
                      `${r2 * Math.cos(toRad(a + 22.5))},${r2 * Math.sin(toRad(a + 22.5))}`,
                    ].join(" ");
                  }).join(" ")}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.7"
                />
                <circle cx="0" cy="0" r="6" fill="none" stroke="#fbbf24" strokeWidth="0.5" />
              </g>
            );
          })
        )}
      </svg>

      <div
        className="flex flex-col items-center gap-7 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sound wave bars */}
        <div className="flex items-end justify-center gap-[3.5px]" style={{ height: 68 }}>
          {bars.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: Math.max(4, h * 68) }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                width: 3,
                borderRadius: 2,
                flexShrink: 0,
                background: phase === "listening"
                  ? `hsl(${(i * 16 + 170) % 360}, 90%, 62%)`
                  : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* Glowing rainbow orb */}
        <motion.div
          initial={{ scale: 0.45, y: 80, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 170, damping: 18 }}
          className="relative flex items-center justify-center"
          style={{ width: 138, height: 138 }}
        >
          {/* Outer blur glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -16,
              background:
                "conic-gradient(from 0deg, #06b6d4, #818cf8, #a855f7, #ec4899, #f97316, #22c55e, #06b6d4)",
              filter: "blur(18px)",
              opacity: phase === "listening" ? 0.6 : 0.3,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          {/* Rainbow border ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -3,
              background:
                "conic-gradient(from 0deg, #06b6d4, #3b82f6, #818cf8, #a855f7, #ec4899, #f97316, #eab308, #22c55e, #06b6d4)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner dark base */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 3,
              background:
                "radial-gradient(circle at 38% 30%, rgba(255,255,255,0.07) 0%, rgba(5,5,18,0.96) 68%)",
            }}
          />

          {/* Inner color pulse */}
          <motion.div
            className="absolute rounded-full"
            style={{ inset: 3 }}
            animate={{
              background: [
                "radial-gradient(circle at center, rgba(6,182,212,0.4) 0%, transparent 68%)",
                "radial-gradient(circle at center, rgba(168,85,247,0.4) 0%, transparent 68%)",
                "radial-gradient(circle at center, rgba(236,72,153,0.4) 0%, transparent 68%)",
                "radial-gradient(circle at center, rgba(34,197,94,0.4) 0%, transparent 68%)",
                "radial-gradient(circle at center, rgba(6,182,212,0.4) 0%, transparent 68%)",
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Mic icon */}
          <div className="relative z-10">
            <Mic size={52} strokeWidth={1.4} className="text-white drop-shadow-xl" />
          </div>
        </motion.div>

        {/* Status label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-white/65 text-[13px] font-medium tracking-wide"
          >
            {phase === "entering"
              ? "جاري التجهيز..."
              : phase === "listening"
              ? "تحدث الآن..."
              : "جاري الإرسال..."}
          </motion.p>
        </AnimatePresence>

        {/* Transcript text */}
        <AnimatePresence mode="wait">
          {displayText ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="max-w-[260px] text-center px-2"
            >
              <p
                className="text-sm leading-relaxed px-4 py-2.5 rounded-2xl"
                style={{
                  color: finalText ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
                  background: finalText
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.06)",
                  border: finalText
                    ? "1px solid rgba(255,255,255,0.18)"
                    : "1px solid rgba(255,255,255,0.08)",
                  fontStyle: finalText ? "normal" : "italic",
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
              <p className="text-xs text-white/30 italic">ما تقوله سيظهر هنا...</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
