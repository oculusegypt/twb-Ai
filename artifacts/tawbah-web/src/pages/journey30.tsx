import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Lock, Star, Trophy, Flame, ChevronDown, ChevronUp,
  BookOpen, BookText, X, Loader2, Play, Square, CheckSquare
} from "lucide-react";
import { getSessionId } from "@/lib/session";

interface JourneyDay {
  day: number;
  title: string;
  tasks: string[];
  verse: string;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

interface JourneyData {
  days: JourneyDay[];
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

const SURAH_TASK_MAP: Array<{ pattern: RegExp; surahs: Array<{ number: number; name: string }> }> = [
  { pattern: /سورة التوبة/,       surahs: [{ number: 9,   name: "سورة التوبة" }] },
  { pattern: /قصة يوسف/,          surahs: [{ number: 12,  name: "سورة يوسف" }] },
  { pattern: /المعوذتين/,          surahs: [{ number: 113, name: "سورة الفلق" }, { number: 114, name: "سورة الناس" }] },
  { pattern: /الكهف/,              surahs: [{ number: 18,  name: "سورة الكهف" }] },
  { pattern: /الفاتحة/,            surahs: [{ number: 1,   name: "سورة الفاتحة" }] },
  { pattern: /البقرة/,             surahs: [{ number: 2,   name: "سورة البقرة" }] },
  { pattern: /آية الكرسي/,        surahs: [{ number: 2,   name: "سورة البقرة (آية الكرسي)" }] },
];

function extractSurahsFromTask(task: string): Array<{ number: number; name: string }> | null {
  for (const entry of SURAH_TASK_MAP) {
    if (entry.pattern.test(task)) return entry.surahs;
  }
  return null;
}

interface SurahAyah { number: number; numberInSurah: number; text: string; }

function SurahReaderModal({
  surahNumber, surahName, onClose
}: { surahNumber: number; surahName: string; onClose: () => void }) {
  const [ayahs, setAyahs] = useState<SurahAyah[]>([]);
  const [tafseerAyahs, setTafseerAyahs] = useState<SurahAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTafseer, setShowTafseer] = useState(false);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const json = await res.json();
        setAyahs(json?.data?.ayahs ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [surahNumber]);

  const loadTafseer = async () => {
    if (tafseerAyahs.length > 0) { setShowTafseer(true); return; }
    setTafseerLoading(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.muyassar`);
      const json = await res.json();
      setTafseerAyahs(json?.data?.ayahs ?? []);
      setShowTafseer(true);
    } catch {
    } finally {
      setTafseerLoading(false);
    }
  };

  const playAyah = (ayahInSurah: number) => {
    const globalNum = toGlobalAyah(surahNumber, ayahInSurah);
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNum}.mp3`;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play();
    } else {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingAyah(null);
    }
    setPlayingAyah(ayahInSurah);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setPlayingAyah(null);
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative mt-auto mx-auto w-full max-w-lg bg-card rounded-t-2xl border border-border shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span className="font-bold text-base">{surahName}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 px-5 py-3 border-b border-border shrink-0">
          <button
            onClick={() => setShowTafseer(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              !showTafseer ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            <BookOpen size={13} />
            قراءة السورة
          </button>
          <button
            onClick={loadTafseer}
            disabled={tafseerLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
              showTafseer ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            {tafseerLoading ? <Loader2 size={13} className="animate-spin" /> : <BookText size={13} />}
            التفسير الميسّر
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}
          {error && (
            <p className="text-sm text-muted-foreground text-center py-8">تعذّر تحميل السورة. تأكد من اتصالك بالإنترنت.</p>
          )}
          {!loading && !error && (
            <div className="flex flex-col gap-3">
              {ayahs.map((ayah) => {
                const tafseerText = tafseerAyahs[ayah.numberInSurah - 1]?.text;
                return (
                  <div key={ayah.number} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {ayah.numberInSurah}
                      </span>
                      <p className="font-display text-[15px] leading-loose text-foreground text-right flex-1" dir="rtl">
                        {ayah.text}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => playingAyah === ayah.numberInSurah ? stopAudio() : playAyah(ayah.numberInSurah)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          playingAyah === ayah.numberInSurah
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/60 border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                        }`}
                      >
                        {playingAyah === ayah.numberInSurah ? (
                          <>
                            <span className="w-2 h-2 bg-primary-foreground rounded-sm" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            استمع
                          </>
                        )}
                      </button>
                    </div>
                    {showTafseer && tafseerText && (
                      <div className="mt-2 pt-2 border-t border-border/40">
                        <p className="text-[11px] text-muted-foreground leading-relaxed" dir="rtl">
                          <span className="font-bold text-primary ml-1">التفسير:</span>
                          {tafseerText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SurahButton({ task }: { task: string }) {
  const [openSurah, setOpenSurah] = useState<{ number: number; name: string } | null>(null);
  const surahs = extractSurahsFromTask(task);
  if (!surahs) return null;

  if (surahs.length === 1) {
    return (
      <>
        <button
          onClick={() => setOpenSurah(surahs[0]!)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
        >
          <BookOpen size={12} />
          قراءة السورة
        </button>
        {openSurah && (
          <SurahReaderModal
            surahNumber={openSurah.number}
            surahName={openSurah.name}
            onClose={() => setOpenSurah(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {surahs.map((s) => (
          <button
            key={s.number}
            onClick={() => setOpenSurah(s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <BookOpen size={12} />
            {s.name}
          </button>
        ))}
      </div>
      {openSurah && (
        <SurahReaderModal
          surahNumber={openSurah.number}
          surahName={openSurah.name}
          onClose={() => setOpenSurah(null)}
        />
      )}
    </>
  );
}

function useTaskCompletion(dayNumber: number, tasksCount: number) {
  const key = `journey30-tasks-day-${dayNumber}`;
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const arr = JSON.parse(saved) as boolean[];
        if (arr.length === tasksCount) return arr;
      }
    } catch {}
    return Array(tasksCount).fill(false);
  });

  const toggle = (i: number) => {
    const next = checked.map((v, idx) => (idx === i ? !v : v));
    setChecked(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };

  const allDone = checked.every(Boolean);
  return { checked, toggle, allDone };
}

function DayTaskList({ day }: { day: JourneyDay }) {
  const { checked, toggle, allDone } = useTaskCompletion(day.day, day.tasks.length);

  return (
    <div>
      <h4 className="text-xs font-bold text-muted-foreground mb-2">مهام اليوم:</h4>
      {allDone && !day.completed && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/5 rounded-lg px-3 py-2 border border-primary/15">
          <CheckCircle2 size={13} />
          أكملت جميع المهام! اضغط الزر أدناه لتسجيل اليوم.
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {day.tasks.map((task, i) => {
          const surahsForTask = extractSurahsFromTask(task);
          return (
            <div key={i} className={`rounded-xl border transition-all ${checked[i] ? "bg-primary/5 border-primary/15" : "bg-muted/20 border-border/50"}`}>
              <div className="flex items-start gap-2.5 p-2.5">
                <button
                  onClick={() => toggle(i)}
                  className="shrink-0 mt-0.5"
                >
                  {checked[i] ? (
                    <CheckSquare size={18} className="text-primary" />
                  ) : (
                    <Square size={18} className="text-muted-foreground/50" />
                  )}
                </button>
                <span className={`text-sm flex-1 leading-relaxed ${checked[i] ? "line-through text-muted-foreground" : ""}`}>
                  {task}
                </span>
              </div>
              {surahsForTask && (
                <div className="px-2.5 pb-2.5 flex flex-wrap gap-1.5">
                  <SurahButton task={task} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Journey30() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const { data, isLoading } = useQuery<JourneyData>({
    queryKey: ["journey30", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/journey30?sessionId=${encodeURIComponent(sessionId)}`);
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: false,
  });

  const completeMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const res = await fetch("/api/journey30/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, dayNumber }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const progress = (data.completedCount / 30) * 100;

  return (
    <div className="flex flex-col flex-1 pb-8 px-5 pt-6 gap-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold mb-1">رحلة ٣٠ يوماً</h1>
        <p className="text-sm text-muted-foreground">طريق التوبة خطوة بخطوة</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={22} />
            <span className="font-bold text-lg">{data.completedCount} / 30 يوم</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              يوم {data.currentDay}
            </span>
          </div>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {data.completedCount === 30
            ? "🎉 أكملت رحلة الـ 30 يوم — بارك الله فيك!"
            : `${30 - data.completedCount} يوم متبقٍ للإنجاز`}
        </p>
      </motion.div>

      {data.completedCount === 30 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-2xl p-5 border border-amber-400/30 text-center"
        >
          <Trophy size={48} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">تهانينا! أتممت الرحلة 🎉</h2>
          <p className="text-sm text-muted-foreground">
            أتممت رحلة الثلاثين يوماً — سجّل الله لك هذا الجهد وقبل منك التوبة إن شاء الله
          </p>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        {data.days.map((day, idx) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
          >
            <div
              className={`rounded-2xl border transition-all ${
                day.completed
                  ? "bg-primary/5 border-primary/20 opacity-80"
                  : day.isCurrent
                  ? "bg-card border-primary/40 shadow-lg shadow-primary/10"
                  : day.isLocked
                  ? "bg-muted/30 border-border opacity-50"
                  : "bg-card border-border"
              }`}
            >
              <button
                className="w-full flex items-center gap-3 p-4 text-right"
                onClick={() => !day.isLocked && setExpandedDay(expandedDay === day.day ? null : day.day)}
                disabled={day.isLocked}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    day.completed
                      ? "bg-primary text-primary-foreground"
                      : day.isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.completed ? (
                    <CheckCircle2 size={20} />
                  ) : day.isLocked ? (
                    <Lock size={16} />
                  ) : (
                    day.day
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{day.title}</span>
                    {day.isCurrent && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                        اليوم
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">اليوم {day.day}</span>
                </div>
                {!day.isLocked && (
                  expandedDay === day.day ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )
                )}
              </button>

              <AnimatePresence>
                {expandedDay === day.day && !day.isLocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex flex-col gap-4">
                      <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                        <p className="text-sm font-medium text-center text-primary leading-relaxed">
                          {day.verse}
                        </p>
                      </div>

                      <DayTaskList day={day} />

                      {!day.completed && (
                        <button
                          onClick={() => completeMutation.mutate(day.day)}
                          disabled={completeMutation.isPending}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {completeMutation.isPending ? "يتم الحفظ..." : "✓ أكملت مهام هذا اليوم"}
                        </button>
                      )}

                      {day.completed && (
                        <div className="flex items-center justify-center gap-2 py-2 text-primary">
                          <CheckCircle2 size={18} />
                          <span className="font-bold text-sm">أُنجز بحمد الله</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
