import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Send, Mic, Play, Pause, Volume2, Loader2, Bot, StopCircle, BookOpen, Scale, ExternalLink, Heart, X, CheckSquare, Handshake, BookMarked, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import { useSettings, QURAN_RECITERS } from "@/context/SettingsContext";

// ══════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════

interface MessageSegment {
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  segments?: MessageSegment[];
  timestamp: Date;
  suggestions?: string[];
  suggestionsLoading?: boolean;
}

interface ApiHistory { role: "user" | "assistant"; content: string; }

// ══════════════════════════════════════════
// QURAN HELPERS
// ══════════════════════════════════════════

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function reciterAudioUrl(surah: number, ayah: number, reciterId: string): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${toGlobalAyah(surah, ayah)}.mp3`;
}

function getSurahName(num: number): string {
  const names: Record<number, string> = {
    1:"الفاتحة",2:"البقرة",3:"آل عمران",4:"النساء",5:"المائدة",
    6:"الأنعام",7:"الأعراف",8:"الأنفال",9:"التوبة",10:"يونس",
    11:"هود",12:"يوسف",13:"الرعد",14:"إبراهيم",15:"الحجر",
    16:"النحل",17:"الإسراء",18:"الكهف",19:"مريم",20:"طه",
    21:"الأنبياء",22:"الحج",23:"المؤمنون",24:"النور",25:"الفرقان",
    26:"الشعراء",27:"النمل",28:"القصص",29:"العنكبوت",30:"الروم",
    31:"لقمان",32:"السجدة",33:"الأحزاب",34:"سبأ",35:"فاطر",
    36:"يس",37:"الصافات",38:"ص",39:"الزمر",40:"غافر",
    41:"فصلت",42:"الشورى",43:"الزخرف",44:"الدخان",45:"الجاثية",
    46:"الأحقاف",47:"محمد",48:"الفتح",49:"الحجرات",50:"ق",
    51:"الذاريات",52:"الطور",53:"النجم",54:"القمر",55:"الرحمن",
    56:"الواقعة",57:"الحديد",58:"المجادلة",59:"الحشر",60:"الممتحنة",
    61:"الصف",62:"الجمعة",63:"المنافقون",64:"التغابن",65:"الطلاق",
    66:"التحريم",67:"الملك",68:"القلم",69:"الحاقة",70:"المعارج",
    71:"نوح",72:"الجن",73:"المزمل",74:"المدثر",75:"القيامة",
    76:"الإنسان",77:"المرسلات",78:"النبأ",79:"النازعات",80:"عبس",
    81:"التكوير",82:"الانفطار",83:"المطففين",84:"الانشقاق",85:"البروج",
    86:"الطارق",87:"الأعلى",88:"الغاشية",89:"الفجر",90:"البلد",
    91:"الشمس",92:"الليل",93:"الضحى",94:"الشرح",95:"التين",
    96:"العلق",97:"القدر",98:"البينة",99:"الزلزلة",100:"العاديات",
    101:"القارعة",102:"التكاثر",103:"العصر",104:"الهمزة",105:"الفيل",
    106:"قريش",107:"الماعون",108:"الكوثر",109:"الكافرون",110:"النصر",
    111:"المسد",112:"الإخلاص",113:"الفلق",114:"الناس",
  };
  return names[num] ?? `السورة ${num}`;
}

// ══════════════════════════════════════════
// STARTER QUESTIONS
// ══════════════════════════════════════════

const STARTER_QUESTIONS = [
  "إزاي أتوب توبة صادقة؟",
  "أنا بعيد عن ربنا، من فين أبدأ؟",
  "عملت ذنب كبير، ربنا هيسامحني؟",
  "إزاي أثبت على الطاعة؟",
  "أنا بحس بوحشة روحية، أعمل إيه؟",
  "الاستغفار بيتقبل منين؟",
];

// ══════════════════════════════════════════
// GREETING
// ══════════════════════════════════════════

const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "أهلاً يا صاحبي! 🌿 أنا الزكي — مش بوت رسمي، أنا صاحبك اللي بيعرف دينه.\n\nابعت صوتك أو اكتب — أنا هنا أسمعك بكل قلبي.\nوالكلام اللي بيننا يفضل بيننا.",
  timestamp: new Date(),
};

// ══════════════════════════════════════════
// TONE BADGE
// ══════════════════════════════════════════

const TONE_STYLES: Array<{ keywords: string[]; emoji: string; className: string }> = [
  { keywords: ["همس", "هامس", "سر"], emoji: "🤫", className: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-300/50" },
  { keywords: ["جدية", "جاد", "خطير"], emoji: "🎯", className: "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-300/50" },
  { keywords: ["حماس", "فرحة", "فرح", "نار"], emoji: "🔥", className: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300/50" },
  { keywords: ["ضحكة", "هزار", "تريق"], emoji: "😄", className: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-300/50" },
  { keywords: ["دفء", "حنان", "دافئ"], emoji: "💙", className: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300/50" },
  { keywords: ["تأمل", "هدوء", "هادئ"], emoji: "🌙", className: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300/50" },
];

function getToneStyle(text: string) {
  for (const style of TONE_STYLES) {
    if (style.keywords.some((k) => text.includes(k))) return style;
  }
  return { emoji: "💬", className: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300/50" };
}

function ToneBadge({ text }: { text: string }) {
  const style = getToneStyle(text);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border mx-0.5 align-middle",
      style.className
    )}>
      <span>{style.emoji}</span>
      <span className="font-sans">{text}</span>
    </span>
  );
}

// ══════════════════════════════════════════
// FORMATTED TEXT RENDERER (with word highlighting)
// ══════════════════════════════════════════

function FormattedText({ text, isActivePlaying }: { text: string; isActivePlaying?: boolean }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  const BULLET_EMOJI_PATTERN = /^([✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊])/;
  const NUMBERED_AR = /^([١٢٣٤٥٦٧٨٩٠]+)[.\-\)]/;
  const NUMBERED_EN = /^(\d+)[.\-\)]/;
  const SECTION_HEADER = /^〔(.+)〕$/;
  const SEPARATOR = /^[═─━─]+$/;

  function arabicNumToInt(s: string): number {
    return parseInt(s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
  }

  function renderInline(raw: string): React.ReactNode[] {
    const stripped = raw.replace(/\(\s*ب[^)]*\)/g, "").replace(/\s{2,}/g, " ");
    const parts: React.ReactNode[] = [];
    const boldRe = /\*\*([^*]+)\*\*/g;
    let cursor = 0;
    let m: RegExpExecArray | null;

    function renderPart(t: string, bold: boolean, keyBase: number): React.ReactNode[] {
      if (bold) return [<strong key={keyBase} className="font-bold text-foreground">{t}</strong>];
      return [<span key={keyBase}>{t}</span>];
    }

    while ((m = boldRe.exec(stripped)) !== null) {
      if (m.index > cursor) parts.push(...renderPart(stripped.slice(cursor, m.index), false, cursor));
      parts.push(...renderPart(m[1]!, true, m.index + 10000));
      cursor = m.index + m[0].length;
    }
    if (cursor < stripped.length) parts.push(...renderPart(stripped.slice(cursor), false, cursor + 20000));
    return parts;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();

    if (!line) { elements.push(<div key={i} className="h-1.5" />); i++; continue; }
    if (SEPARATOR.test(line)) { i++; continue; }

    const sectionMatch = SECTION_HEADER.exec(line);
    if (sectionMatch) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] font-bold text-muted-foreground tracking-widest px-2">{sectionMatch[1]}</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>
      );
      i++; continue;
    }

    if (NUMBERED_AR.test(line) || NUMBERED_EN.test(line)) {
      const listItems: string[] = [];
      let startNum = 1;
      let firstItem = true;
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (!l) { i++; continue; }
        if (!NUMBERED_AR.test(l) && !NUMBERED_EN.test(l)) break;
        i++;
        if (firstItem) {
          const arMatch = NUMBERED_AR.exec(l);
          const enMatch = NUMBERED_EN.exec(l);
          const numStr = arMatch ? arMatch[1]! : enMatch ? enMatch[1]! : "1";
          const parsed = /[١٢٣٤٥٦٧٨٩٠]/.test(numStr) ? arabicNumToInt(numStr) : parseInt(numStr);
          startNum = isNaN(parsed) ? 1 : parsed;
          firstItem = false;
        }
        const content = l.replace(/^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)]\s*/, "");
        if (content.trim()) listItems.push(content);
      }
      if (listItems.length > 0) {
        elements.push(
          <ol key={`list-${i}`} className="space-y-1.5 my-2 pr-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {startNum + idx}
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      continue;
    }

    if (line.startsWith("•") || line.startsWith("·") || BULLET_EMOJI_PATTERN.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (l.startsWith("•") || l.startsWith("·") || BULLET_EMOJI_PATTERN.test(l)) {
          const emojiMatch = BULLET_EMOJI_PATTERN.exec(l);
          const icon = emojiMatch ? emojiMatch[1] : "•";
          const content = l.replace(/^[•·]\s*/, "").replace(/^[✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊]\s*/, "");
          listItems.push(`${icon}|||${content}`);
          i++;
        } else break;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => {
            const [icon, ...rest] = item.split("|||");
            const content = rest.join("|||");
            const isBullet = icon === "•" || icon === "·";
            return (
              <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="flex-shrink-0 mt-0.5 text-base">
                  {isBullet ? <span className="text-teal-500 font-bold">•</span> : icon}
                </span>
                <span className="flex-1">{renderInline(content!)}</span>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }

  return (
    <div className={cn(
      "space-y-0.5 rounded-xl transition-colors duration-300",
      isActivePlaying && "bg-teal-50/60 dark:bg-teal-950/30 px-2 py-1 -mx-2"
    )}>
      {elements}
    </div>
  );
}

// ══════════════════════════════════════════
// QURAN CARD
// ══════════════════════════════════════════

function QuranCard({
  seg, isActive, isPlaying, onEnded, onManualToggle, reciterId,
}: {
  seg: MessageSegment;
  isActive: boolean;
  isPlaying: boolean;
  onEnded: () => void;
  onManualToggle: () => void;
  reciterId: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [verseText, setVerseText] = useState<string>(seg.text);
  const [verseLoading, setVerseLoading] = useState(true);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  // Fetch the actual verse text from the official Quran API (never rely on AI text)
  useEffect(() => {
    setVerseLoading(true);
    const globalAyah = toGlobalAyah(seg.surah!, seg.ayah!);
    fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/quran-uthmani`)
      .then(r => r.json())
      .then((data: { data?: { text?: string } }) => {
        if (data?.data?.text) setVerseText(data.data.text);
      })
      .catch(() => { /* keep seg.text as fallback */ })
      .finally(() => setVerseLoading(false));
  }, [seg.surah, seg.ayah]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = reciterAudioUrl(seg.surah!, seg.ayah!, reciterId);
    audioRef.current = audio;
    setAudioError(false);
    audio.onended = () => onEndedRef.current();
    audio.onerror = () => { setAudioError(true); onEndedRef.current(); };
    return () => { audio.pause(); audio.src = ""; audio.onended = null; audio.onerror = null; audioRef.current = null; };
  }, [seg.surah, seg.ayah, reciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive && isPlaying) {
      setAudioError(false);
      audio.play().catch((e: unknown) => {
        if (e instanceof Error && e.name === "NotAllowedError") {
          setIsPlaying_noop();
        }
      });
    } else {
      audio.pause();
      if (!isActive) audio.currentTime = 0;
    }
  }, [isActive, isPlaying]);

  // no-op to avoid lint warning (isPlaying state is managed by parent)
  function setIsPlaying_noop() {}

  return (
    <div className="my-2 rounded-2xl border border-amber-400/50 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-l from-amber-800 to-amber-900 dark:from-amber-950 dark:to-yellow-950 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-amber-300" />
          <span className="text-[11px] font-bold text-amber-200 tracking-wide">
            سورة {getSurahName(seg.surah!)} — آية {seg.ayah}
          </span>
        </div>
        <button
          onClick={onManualToggle}
          className={cn(
            "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full transition-all font-medium",
            isActive && isPlaying
              ? "bg-amber-400 text-amber-900"
              : "bg-amber-900/60 text-amber-300 hover:bg-amber-800/60"
          )}
        >
          {isActive && isPlaying
            ? <><Pause size={10} /> إيقاف</>
            : <><Play size={10} /> {QURAN_RECITERS.find(r => r.id === reciterId)?.nameAr ?? "استمع"}</>
          }
        </button>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 px-4 py-4">
        {verseLoading ? (
          <div className="flex justify-center py-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce mx-0.5" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <p className="quran-text text-right text-amber-950 dark:text-amber-100">
            ﴿{verseText}﴾
          </p>
        )}
        {isActive && isPlaying && (
          <div className="flex gap-0.5 items-end justify-center mt-2 h-4">
            {[1,2,3,4,5,6,7].map((k) => (
              <span key={k} className="w-0.5 bg-amber-500 rounded-full animate-bounce"
                style={{ height: `${3 + (k % 4) * 3}px`, animationDelay: `${k * 60}ms` }} />
            ))}
          </div>
        )}
        {audioError && (
          <p className="text-[10px] text-amber-500/70 text-center mt-1">تعذّر تشغيل الصوت</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FATWA CARD
// ══════════════════════════════════════════

function FatwaCard({ seg }: { seg: MessageSegment }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (seg.text?.length ?? 0) > 120 ? seg.text!.slice(0, 120) + "..." : seg.text;

  return (
    <div className="my-2 rounded-2xl border border-emerald-400/50 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-l from-emerald-800 to-teal-900 dark:from-emerald-950 dark:to-teal-950 px-4 py-2 flex items-center gap-2">
        <Scale size={13} className="text-emerald-300" />
        <span className="text-[11px] font-bold text-emerald-200 tracking-wide">حكم شرعي</span>
        <span className="mr-auto text-[10px] text-emerald-400/80">📚 {seg.source}</span>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 px-4 py-3">
        <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200 text-right">
          {expanded ? seg.text : preview}
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30">
          {(seg.text?.length ?? 0) > 120 && (
            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
              {expanded ? "إخفاء" : "عرض الكامل"}
            </button>
          )}
          {seg.url && (
            <a href={seg.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium mr-auto">
              <ExternalLink size={10} /> المصدر
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PROMISE CARD
// ══════════════════════════════════════════

function PromiseCard({ seg, sessionId }: { seg: MessageSegment; sessionId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handlePromise() {
    setState("loading");
    try {
      await fetch("/api/zakiy/promise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, promiseText: seg.text }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-2xl border border-amber-400/60 overflow-hidden shadow-md"
    >
      <div className="bg-gradient-to-l from-amber-700 to-yellow-800 dark:from-amber-900 dark:to-yellow-950 px-4 py-2 flex items-center gap-2">
        <Handshake size={13} className="text-amber-200" />
        <span className="text-[11px] font-bold text-amber-100 tracking-wide">وعد أمام الله</span>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 px-4 py-4">
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200 text-right font-medium mb-4">
          "{seg.text}"
        </p>
        {state === "done" ? (
          <div className="flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl py-2.5">
            <CheckSquare size={16} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">وعدتَ الله — والله شاهد على وعدك</span>
          </div>
        ) : (
          <button
            onClick={handlePromise}
            disabled={state === "loading"}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 font-bold text-sm transition-all active:scale-95"
          >
            {state === "loading"
              ? <><Loader2 size={14} className="animate-spin" /> لحظة...</>
              : <><Handshake size={14} /> أعدك بالله</>
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// SURAH LINK CARD
// ══════════════════════════════════════════

function SurahLinkCard({ seg }: { seg: MessageSegment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2 rounded-2xl border border-teal-400/50 overflow-hidden shadow-sm"
    >
      <div className="bg-gradient-to-l from-teal-700 to-emerald-800 dark:from-teal-950 dark:to-emerald-950 px-4 py-2 flex items-center gap-2">
        <BookMarked size={13} className="text-teal-200" />
        <span className="text-[11px] font-bold text-teal-100 tracking-wide">السورة كاملة</span>
      </div>
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-teal-900 dark:text-teal-200">سورة {seg.text}</p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">تابع قراءة باقي السورة من الآية {seg.ayah}</p>
        </div>
        <a
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-teal-600 text-white text-xs px-3 py-2 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <ExternalLink size={12} />
          افتح السورة
        </a>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// IMPRESSION PANEL
// ══════════════════════════════════════════

function ImpressionPanel({ impression, onClose }: { impression: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="mt-2 rounded-2xl border border-rose-300/50 overflow-hidden shadow-md"
    >
      <div className="bg-gradient-to-l from-rose-700 to-pink-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart size={13} className="text-rose-200 fill-rose-300" />
          <span className="text-[11px] font-bold text-rose-100 tracking-wide">انطباعي عنك</span>
        </div>
        <button onClick={onClose} className="text-rose-300 hover:text-rose-100 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 px-4 py-3">
        <p className="text-sm leading-relaxed text-rose-900 dark:text-rose-200 text-right whitespace-pre-wrap">
          {impression}
        </p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// SUGGESTION CARDS (outside bubble, like starter cards)
// ══════════════════════════════════════════

function SuggestionCards({ suggestions, loading, onSelect }: {
  suggestions?: string[];
  loading?: boolean;
  onSelect: (q: string) => void;
}) {
  if (!loading && (!suggestions || suggestions.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 pr-9"
    >
      {loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <Loader2 size={11} className="animate-spin" />
          <span>يفكر في أسئلة...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {suggestions!.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(q)}
              className="text-right text-xs px-3 py-2 rounded-xl border border-border/60 bg-card hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:border-teal-400/50 text-foreground transition-all active:scale-95 shadow-sm leading-snug font-medium"
            >
              {q}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════
// STARTER CARDS
// ══════════════════════════════════════════

function StarterCards({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="px-2 py-3"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs font-semibold text-muted-foreground">✨ أسئلة شائعة — اضغط لتبدأ</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STARTER_QUESTIONS.map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => onSelect(q)}
            className="text-right text-xs px-3 py-2.5 rounded-xl border border-border/60 bg-card hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:border-teal-400/50 text-foreground transition-all active:scale-95 shadow-sm leading-snug"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════
// BOT MESSAGE BODY — sequential segment playback
// ══════════════════════════════════════════

function BotMessageBody({
  msg, onImpressionToggle, impressionOpen, impressionText, sessionId, history, isLatest,
}: {
  msg: Message;
  onImpressionToggle: (id: string, text?: string) => void;
  impressionOpen: boolean;
  impressionText?: string;
  sessionId: string;
  history: ApiHistory[];
  isLatest: boolean;
}) {
  const { autoPlayBotAudio, autoPlayQuran, quranReciterId } = useSettings();

  // ── Playback state machine ──
  // playIdx: which segment index is currently "active" (-1 = stopped)
  // isPlaying: whether we are currently playing (vs paused)
  const [playIdx, setPlayIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoStartedRef = useRef(false);

  const textAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

  const segments = msg.segments ?? [];

  // Helper: advance to next segment
  const advanceTo = useCallback((nextIdx: number) => {
    const seg = segments[nextIdx];
    if (!seg) { setPlayIdx(-1); setIsPlaying(false); return; }

    // Skip fatwa, promise, surah-link segments (no audio)
    if (seg.type === "fatwa" || seg.type === "promise" || seg.type === "surah-link") {
      advanceTo(nextIdx + 1); return;
    }

    // Quran segments play automatically with reciter audio in sequence
    setPlayIdx(nextIdx);
    setIsPlaying(true);
  }, [segments]);

  // Auto-play for the latest message respecting both settings
  useEffect(() => {
    if (!isLatest || autoStartedRef.current) return;
    const hasTextAudio = segments.some(s => s.type === "text" && s.audioBase64);
    const hasQuran = segments.some(s => s.type === "quran");
    const shouldStart = (autoPlayBotAudio && hasTextAudio) || (autoPlayQuran && hasQuran);
    if (!shouldStart) return;
    autoStartedRef.current = true;
    const t = setTimeout(() => advanceTo(0), 400);
    return () => clearTimeout(t);
  }, [isLatest, autoPlayBotAudio, autoPlayQuran, segments]);

  // When a segment ends, move to next
  const handleSegmentEnd = useCallback((idx: number) => {
    advanceTo(idx + 1);
  }, [advanceTo]);

  // Text segment audio playback
  useEffect(() => {
    if (playIdx === -1 || !isPlaying) return;
    const seg = segments[playIdx];
    if (!seg || seg.type !== "text") return;
    if (!seg.audioBase64) { handleSegmentEnd(playIdx); return; }

    let audio = textAudioRefs.current[playIdx];
    if (!audio) {
      const binary = atob(seg.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mp3" }));
      audio = new Audio(url);
      textAudioRefs.current[playIdx] = audio;
    }

    audio.onended = () => { handleSegmentEnd(playIdx); };
    audio.play().catch((e: unknown) => {
      if (e instanceof Error && e.name === "NotAllowedError") {
        // Browser blocked autoplay — stop and let user tap the play button manually
        setIsPlaying(false);
      } else {
        // Actual audio error (bad format, network) — skip to next
        handleSegmentEnd(playIdx);
      }
    });

    return () => { audio?.pause(); };
  }, [playIdx, isPlaying]);

  // Manual play/pause toggle for entire message
  function handlePlayToggle() {
    if (segments.length === 0) return;
    if (playIdx !== -1 && isPlaying) {
      // Pause
      if (segments[playIdx]?.type === "text") {
        textAudioRefs.current[playIdx]?.pause();
      }
      setIsPlaying(false);
    } else if (playIdx !== -1 && !isPlaying) {
      // Resume
      if (segments[playIdx]?.type === "text") {
        textAudioRefs.current[playIdx]?.play().catch(() => {});
      }
      setIsPlaying(true);
    } else {
      // Start from beginning
      advanceTo(0);
    }
  }

  const hasAudio = segments.some(s => s.type === "text" && s.audioBase64);
  const isCurrentlyPlaying = playIdx !== -1 && isPlaying;

  // ── Hadi Tasks ──
  const [hadiLoading, setHadiLoading] = useState(false);
  const [hadiDone, setHadiDone] = useState(false);
  const [, navigate] = useLocation();

  const hasSteps = (() => {
    const fullText = segments.map(s => s.text).join("\n");
    return /[\u0661-\u0669][\.\-\)]|^[1-9][\.\-\)]/m.test(fullText) || /^[\u0661-\u0669][\.\-\)]/m.test(fullText);
  })();

  async function handleHadiTasks() {
    setHadiLoading(true);
    try {
      const fullText = segments.map(s => s.text).join("\n").slice(0, 2000);
      const res = await fetch("/api/hadi-tasks/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الاستخراج");
      setHadiDone(true);
      setTimeout(() => navigate("/hadi-tasks"), 600);
    } catch {
      setHadiDone(false);
    } finally {
      setHadiLoading(false);
    }
  }

  // ── Impression ──
  const [impressionLoading, setImpressionLoading] = useState(false);

  async function handleImpressionClick() {
    if (impressionOpen) { onImpressionToggle(msg.id); return; }
    if (impressionText) { onImpressionToggle(msg.id, impressionText); return; }
    setImpressionLoading(true);
    try {
      const res = await fetch("/api/zakiy/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      onImpressionToggle(msg.id, data.impression ?? "لسه بتعرف بعضنا — كمّل الحديث وهشوفك أكتر!");
    } catch {
      onImpressionToggle(msg.id, "مش قدرت أوصلك الانطباع دلوقتي — جرّب تاني بعد شوية.");
    } finally {
      setImpressionLoading(false);
    }
  }

  // Render: if no segments (greeting or old format), render raw text
  if (!segments.length) {
    return <FormattedText text={msg.text} />;
  }

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === "quran") {
          return (
            <QuranCard
              key={i}
              seg={seg}
              isActive={playIdx === i}
              isPlaying={playIdx === i && isPlaying}
              onEnded={() => handleSegmentEnd(i)}
              reciterId={quranReciterId}
              onManualToggle={() => {
                if (playIdx === i && isPlaying) {
                  setIsPlaying(false);
                } else {
                  setPlayIdx(i);
                  setIsPlaying(true);
                }
              }}
            />
          );
        }
        if (seg.type === "fatwa") return <FatwaCard key={i} seg={seg} />;
        if (seg.type === "promise") return <PromiseCard key={i} seg={seg} sessionId={sessionId} />;
        if (seg.type === "surah-link") return <SurahLinkCard key={i} seg={seg} />;
        return (
          <FormattedText
            key={i}
            text={seg.text}
            isActivePlaying={playIdx === i && isPlaying}
          />
        );
      })}

      {/* Audio & impression controls */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {hasAudio && (
          <button
            onClick={handlePlayToggle}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all",
              isCurrentlyPlaying
                ? "bg-teal-600 text-white"
                : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100"
            )}
          >
            {isCurrentlyPlaying ? <><Pause size={12} /> إيقاف</> : <><Volume2 size={12} /> استمع</>}
          </button>
        )}

        {msg.id !== "greeting" && (
          <button
            onClick={handleImpressionClick}
            disabled={impressionLoading}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all border",
              impressionOpen
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-300/60 hover:bg-rose-100"
            )}
          >
            {impressionLoading
              ? <><Loader2 size={12} className="animate-spin" /> لحظة...</>
              : <><Heart size={12} className={impressionOpen ? "fill-white" : ""} /> انطباعي عنك</>
            }
          </button>
        )}

        {msg.id !== "greeting" && hasSteps && (
          <button
            onClick={handleHadiTasks}
            disabled={hadiLoading || hadiDone}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all border",
              hadiDone
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300/60 hover:bg-emerald-100"
            )}
          >
            {hadiLoading
              ? <><Loader2 size={12} className="animate-spin" /> جاري الاستخراج...</>
              : hadiDone
                ? <><CheckSquare size={12} /> تمت الإضافة!</>
                : <><CheckSquare size={12} /> مهام هادي</>
            }
          </button>
        )}
      </div>

      <AnimatePresence>
        {impressionOpen && impressionText && (
          <ImpressionPanel impression={impressionText} onClose={() => onImpressionToggle(msg.id)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════
// AUDIO HELPERS
// ══════════════════════════════════════════

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════

export default function ZakiyPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [impressionOpenId, setImpressionOpenId] = useState<string | null>(null);
  const [impressionTexts, setImpressionTexts] = useState<Record<string, string>>({});
  const [riskAlert, setRiskAlert] = useState<{ level: "medium" | "high"; message: string; sign: string | null } | null>(null);
  const [riskDismissed, setRiskDismissed] = useState(false);
  const [anniversaryMilestone, setAnniversaryMilestone] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sessionId = getSessionId();
  const hasUserMessages = messages.some((m) => m.role === "user");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();

    async function checkAnniversaryAndRisk() {
      try {
        const [annRes, riskRes] = await Promise.all([
          fetch(`${base}/api/zakiy/anniversary?sessionId=${sessionId}`, { signal: controller.signal }),
          fetch(`${base}/api/zakiy/risk-check?sessionId=${sessionId}`, { signal: controller.signal }),
        ]);
        const [annData, riskData] = await Promise.all([
          annRes.json() as Promise<{ anniversary: { milestone: string; message: string } | null }>,
          riskRes.json() as Promise<{ riskLevel: string; message: string; warningSign: string | null }>,
        ]);

        if (annData.anniversary?.message) {
          const { milestone, message } = annData.anniversary;
          setAnniversaryMilestone(milestone);
          const annMsg: Message = {
            id: "anniversary-" + Date.now(),
            role: "bot",
            text: message,
            segments: [{ type: "text", text: message }],
            timestamp: new Date(),
            suggestions: [],
            suggestionsLoading: false,
          };
          setMessages((prev) => [...prev, annMsg]);
        }

        if (riskData.riskLevel === "medium" || riskData.riskLevel === "high") {
          setRiskAlert({
            level: riskData.riskLevel as "medium" | "high",
            message: riskData.message,
            sign: riskData.warningSign,
          });
        }
      } catch { /* ignore — background check */ }
    }

    checkAnniversaryAndRisk();
    return () => controller.abort();
  }, [sessionId, base]);

  function buildHistory(): ApiHistory[] {
    return messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.text }));
  }

  function handleImpressionToggle(id: string, text?: string) {
    if (impressionOpenId === id) {
      setImpressionOpenId(null);
    } else {
      if (text) setImpressionTexts((prev) => ({ ...prev, [id]: text }));
      setImpressionOpenId(id);
    }
  }

  async function fetchSuggestions(history: ApiHistory[], msgId: string) {
    try {
      const res = await fetch("/api/zakiy/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: data.suggestions ?? [], suggestionsLoading: false }
          : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId
          ? { ...m, suggestions: [], suggestionsLoading: false }
          : m)
      );
    }
  }

  function addBotMessage(text: string, segments?: MessageSegment[]) {
    const msg: Message = {
      id: Date.now().toString(),
      role: "bot",
      text,
      segments: segments ?? [],
      timestamp: new Date(),
      suggestions: [],
      suggestionsLoading: true,
    };
    setMessages((prev) => [...prev, msg]);
    const currentHistory = buildHistory();
    fetchSuggestions([...currentHistory, { role: "assistant", content: text }], msg.id);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "u", role: "user", text, timestamp: new Date() },
    ]);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const history = buildHistory();
    addUserMessage(text);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/zakiy/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history, sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      addBotMessage(data.response, data.segments);
    } catch {
      addBotMessage("عذراً يا صاحبي، في مشكلة تقنية. جرّب تاني بعد شوية.");
    } finally {
      setLoading(false);
    }
  }

  async function sendVoice(audioBlob: Blob) {
    if (loading) return;
    const history = buildHistory();
    setLoading(true);

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = arrayBufferToBase64(arrayBuffer);

      const res = await fetch("/api/zakiy/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, history, sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      addUserMessage(data.transcript || "🎤 رسالة صوتية");
      addBotMessage(data.response, data.segments);
    } catch {
      addBotMessage("مش قدرت أفهم التسجيل كويس — جرّب تاني أو اكتبلي.");
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        sendVoice(new Blob(audioChunksRef.current, { type: mr.mimeType }));
      };
      mr.start(200);
      setRecording(true);
    } catch {
      alert("يرجى السماح بالوصول إلى الميكروفون");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">الزكي</h1>
          <p className="text-xs text-muted-foreground">صاحبك الروحاني دايماً معاك</p>
        </div>
        <div className="mr-auto flex items-center gap-1.5">
          {anniversaryMilestone && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-300/40">
              <Sparkles size={11} /> {anniversaryMilestone}
            </span>
          )}
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">متصل</span>
        </div>
      </div>

      {/* Risk Alert Banner */}
      <AnimatePresence>
        {riskAlert && !riskDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "overflow-hidden border-b",
              riskAlert.level === "high"
                ? "bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30"
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <AlertTriangle size={16} className={cn("mt-0.5 flex-shrink-0", riskAlert.level === "high" ? "text-red-500" : "text-amber-500")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold mb-0.5", riskAlert.level === "high" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                  {riskAlert.level === "high" ? "⚠️ الزكي قلقان عليك" : "💛 الزكي يلاحظ"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{riskAlert.message}</p>
                {riskAlert.sign && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">العلامة: {riskAlert.sign}</p>
                )}
              </div>
              <button onClick={() => setRiskDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, msgIdx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn("flex items-end gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mb-1">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tl-sm"
                    : "bg-card border border-border/60 text-foreground rounded-tr-sm"
                )}>
                  {msg.role === "bot" ? (
                    <BotMessageBody
                      msg={msg}
                      onImpressionToggle={handleImpressionToggle}
                      impressionOpen={impressionOpenId === msg.id}
                      impressionText={impressionTexts[msg.id]}
                      sessionId={sessionId}
                      history={buildHistory()}
                      isLatest={msg.role === "bot" && msgIdx === messages.map(m => m.role).lastIndexOf("bot")}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className="text-[10px] opacity-50 mt-1 text-end">
                    {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Suggestions OUTSIDE the bubble */}
              {msg.role === "bot" && msg.id !== "greeting" && (
                <SuggestionCards
                  suggestions={msg.suggestions}
                  loading={msg.suggestionsLoading}
                  onSelect={(q) => sendMessage(q)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasUserMessages && !loading && (
          <StarterCards onSelect={(q) => sendMessage(q)} />
        )}

        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl rounded-tr-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border/50 bg-card/60 backdrop-blur-sm">
        {recording && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-full">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">جارٍ التسجيل... اضغط للإيقاف</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
              recording ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {recording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder="اكتب ما في قلبك... أو اضغط على الميك 🎤"
              disabled={loading || recording}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50",
                "max-h-32 overflow-y-auto leading-relaxed transition-all",
                (loading || recording) && "opacity-60"
              )}
              style={{ minHeight: "42px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || recording}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
              input.trim() && !loading && !recording
                ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white hover:opacity-90 active:scale-95"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="scale-x-[-1]" />}
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
          ما تقوله هنا آمن ومحفوظ بيننا فقط
        </p>
      </div>
    </div>
  );
}
