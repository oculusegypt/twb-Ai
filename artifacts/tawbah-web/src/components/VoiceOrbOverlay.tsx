import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useLocation } from "wouter";

const NUM_BARS = 22;

export function VoiceOrbOverlay({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [bars, setBars] = useState<number[]>(Array(NUM_BARS).fill(0.06));
  const [phase, setPhase] = useState<"entering" | "listening" | "done">("entering");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  const stopAudio = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const finishAndNavigate = useCallback(() => {
    stopAudio();
    setPhase("done");
    setTimeout(() => {
      navigate("/zakiy");
      onClose();
    }, 380);
  }, [stopAudio, navigate, onClose]);

  const startListening = useCallback(async () => {
    setPhase("listening");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const newBars = Array.from({ length: NUM_BARS }, (_, i) => {
          const idx = Math.floor((i / NUM_BARS) * data.length * 0.55);
          return Math.max(0.05, (data[idx] ?? 0) / 255);
        });
        setBars(newBars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* mic denied — still run recognition */
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      finishAndNavigate();
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final.trim()) localStorage.setItem("zakiy_voice_input", final.trim());
    };
    recognition.onend = finishAndNavigate;
    recognition.onerror = finishAndNavigate;
    recognition.start();
  }, [finishAndNavigate]);

  useEffect(() => {
    const t = setTimeout(startListening, 520);
    return () => clearTimeout(t);
  }, [startListening]);

  useEffect(() => {
    return () => {
      stopAudio();
      recognitionRef.current?.abort();
    };
  }, [stopAudio]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sound wave bars */}
        <div className="flex items-end justify-center gap-[3.5px]" style={{ height: 68 }}>
          {bars.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: Math.max(4, h * 68) }}
              transition={{ duration: 0.07, ease: "linear" }}
              style={{
                width: 3,
                borderRadius: 2,
                flexShrink: 0,
                background: `hsl(${(i * 16 + 170) % 360}, 90%, 62%)`,
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
          {/* Outer blur glow — counter-rotating */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: -16,
              background:
                "conic-gradient(from 0deg, #06b6d4, #818cf8, #a855f7, #ec4899, #f97316, #22c55e, #06b6d4)",
              filter: "blur(18px)",
              opacity: 0.55,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          {/* Rainbow border ring — rotating */}
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
      </div>
    </motion.div>
  );
}
