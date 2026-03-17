import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Play, Pause, Volume2, Loader2, Bot, StopCircle, BookOpen, Scale, ExternalLink, Sparkles, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";

// ══════════════════════════════════════════
// QURAN HELPERS
// ══════════════════════════════════════════

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function misharyUrl(surah: number, ayah: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(surah, ayah)}.mp3`;
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
// SEGMENT PARSING
// ══════════════════════════════════════════

interface QuranSegment { type: "quran"; surah: number; ayah: number; text: string; }
interface FatwaSegment { type: "fatwa"; source: string; url: string; text: string; }
interface TextSegment { type: "text"; text: string; }
type Segment = QuranSegment | FatwaSegment | TextSegment;

function stripStageDirections(text: string): string {
  return text.replace(/\(\s*ب[^)]*\)/g, "").replace(/\s{2,}/g, " ").trim();
}

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  const combined = /\{\{quran:(\d+):(\d+)\|([^}]*)\}\}|\{\{fatwa:([^|]*)\|([^|]*)\|([^}]*)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(raw)) !== null) {
    if (match.index > last) {
      const t = stripStageDirections(raw.slice(last, match.index).trim());
      if (t) segments.push({ type: "text", text: t });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "quran", surah: Number(match[1]), ayah: Number(match[2]), text: match[3]! });
    } else {
      segments.push({ type: "fatwa", source: match[4]!, url: match[5]!, text: match[6]! });
    }
    last = match.index + match[0].length;
  }

  if (last < raw.length) {
    const t = stripStageDirections(raw.slice(last).trim());
    if (t) segments.push({ type: "text", text: t });
  }

  return segments.length ? segments : [{ type: "text", text: stripStageDirections(raw) }];
}

// ══════════════════════════════════════════
// FORMATTED TEXT RENDERER
// ══════════════════════════════════════════

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  const BULLET_EMOJI_PATTERN = /^([✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊])/;
  const NUMBERED_AR = /^([١٢٣٤٥٦٧٨٩٠]+)[.\-\)]/;
  const NUMBERED_EN = /^(\d+)[.\-\)]/;
  const SECTION_HEADER = /^〔(.+)〕$/;
  const SEPARATOR = /^[═─━─]+$/;

  function renderInline(raw: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const boldRe = /\*\*([^*]+)\*\*/g;
    let cursor = 0;
    let m: RegExpExecArray | null;
    while ((m = boldRe.exec(raw)) !== null) {
      if (m.index > cursor) parts.push(raw.slice(cursor, m.index));
      parts.push(<strong key={m.index} className="font-bold text-foreground">{m[1]}</strong>);
      cursor = m.index + m[0].length;
    }
    if (cursor < raw.length) parts.push(raw.slice(cursor));
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
      while (i < lines.length && (NUMBERED_AR.test(lines[i]!.trim()) || NUMBERED_EN.test(lines[i]!.trim()))) {
        const l = lines[i]!.trim();
        const content = l.replace(/^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)]\s*/, "");
        listItems.push(content);
        i++;
      }
      elements.push(
        <ol key={`list-${i}`} className="space-y-1.5 my-2 pr-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
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
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
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
// QURAN CARD — sequential playback
// ══════════════════════════════════════════

function QuranCard({
  seg, isActive, onEnded, onManualToggle, isPlaying,
}: {
  seg: QuranSegment;
  isActive: boolean;
  isPlaying: boolean;
  onEnded: () => void;
  onManualToggle: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = misharyUrl(seg.surah, seg.ayah);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => onEnded();
    return () => { audio.pause(); audioRef.current = null; };
  }, [seg.surah, seg.ayah]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isActive && isPlaying) {
      audio.play().catch(() => {});
    } else if (!isPlaying) {
      audio.pause();
      if (!isActive) audio.currentTime = 0;
    }
  }, [isActive, isPlaying]);

  const surahName = getSurahName(seg.surah);

  return (
    <div className="my-2 rounded-2xl border border-amber-400/50 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-l from-amber-800 to-amber-900 dark:from-amber-950 dark:to-yellow-950 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-amber-300" />
          <span className="text-[11px] font-bold text-amber-200 tracking-wide">سورة {surahName} — آية {seg.ayah}</span>
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
          {isActive && isPlaying ? <><Pause size={10} /> إيقاف</> : <><Play size={10} /> مشاري</>}
        </button>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 px-4 py-4">
        <p className="quran-text text-right text-amber-950 dark:text-amber-100 leading-[2.4]">
          ﴿{seg.text}﴾
        </p>
        {isActive && isPlaying && (
          <div className="flex gap-0.5 items-end justify-center mt-2 h-4">
            {[1,2,3,4,5,6,7].map((k) => (
              <span
                key={k}
                className="w-0.5 bg-amber-500 rounded-full animate-bounce"
                style={{ height: `${3 + (k % 4) * 3}px`, animationDelay: `${k * 60}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
// FATWA CARD
// ══════════════════════════════════════════

function FatwaCard({ seg }: { seg: FatwaSegment }) {
  const [expanded, setExpanded] = useState(false);
  const preview = seg.text.length > 120 ? seg.text.slice(0, 120) + "..." : seg.text;

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
          {seg.text.length > 120 && (
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
// SUGGESTION CHIPS
// ══════════════════════════════════════════

function SuggestionChips({ suggestions, onSelect, loading }: { suggestions: string[]; onSelect: (q: string) => void; loading?: boolean }) {
  if (!suggestions.length && !loading) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap gap-2 justify-end mt-2"
    >
      {loading ? (
        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> يفكر في أسئلة...</span>
      ) : (
        suggestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="text-[11px] px-3 py-1.5 rounded-full border border-teal-400/60 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all active:scale-95 font-medium shadow-sm"
          >
            {q}
          </button>
        ))
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════
// STARTER QUESTION CARDS
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
        <Sparkles size={13} className="text-teal-500" />
        <span className="text-xs font-semibold text-muted-foreground">أسئلة شائعة — اضغط لتبدأ</span>
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
// MESSAGE TYPES
// ══════════════════════════════════════════

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  audioBase64?: string;
  timestamp: Date;
  suggestions?: string[];
  suggestionsLoading?: boolean;
}

interface ApiHistory { role: "user" | "assistant"; content: string; }

const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "أهلاً يا صاحبي! 🌿 أنا الزكي — مش بوت رسمي، أنا صاحبك اللي بيعرف دينه.\n\nابعت صوتك أو اكتب — أنا هنا أسمعك بكل قلبي.\nوالكلام اللي بيننا يفضل بيننا.",
  timestamp: new Date(),
};

// ══════════════════════════════════════════
// BOT MESSAGE BODY — with sequential Quran
// ══════════════════════════════════════════

function BotMessageBody({
  msg, playingId, onPlay, quranReady, onSuggestionSelect, sessionId, history, showImpressionFor, onToggleImpression,
}: {
  msg: Message;
  playingId: string | null;
  onPlay: (id: string, b64: string) => void;
  quranReady?: boolean;
  onSuggestionSelect: (q: string) => void;
  sessionId: string;
  history: ApiHistory[];
  showImpressionFor: string | null;
  onToggleImpression: (id: string, impression?: string) => void;
}) {
  const segments = parseSegments(msg.text);

  // Sequential Quran playback state
  const [quranPlayIdx, setQuranPlayIdx] = useState(-1);
  const [quranIsPlaying, setQuranIsPlaying] = useState(false);
  const quranSegments = segments.filter((s): s is QuranSegment => s.type === "quran");

  // Map: quranSegment index within all quran segments of this message
  const quranIndexMap = useRef<Map<QuranSegment, number>>(new Map());
  quranSegments.forEach((s, idx) => quranIndexMap.current.set(s, idx));

  // When bot audio finishes, start quran sequence
  useEffect(() => {
    if (quranReady && quranSegments.length > 0 && quranPlayIdx === -1) {
      setQuranPlayIdx(0);
      setQuranIsPlaying(true);
    }
  }, [quranReady]);

  function handleQuranEnded(idx: number) {
    const next = idx + 1;
    if (next < quranSegments.length) {
      setQuranPlayIdx(next);
      setQuranIsPlaying(true);
    } else {
      setQuranPlayIdx(-1);
      setQuranIsPlaying(false);
    }
  }

  function handleManualToggle(idx: number) {
    if (quranPlayIdx === idx && quranIsPlaying) {
      setQuranIsPlaying(false);
    } else {
      setQuranPlayIdx(idx);
      setQuranIsPlaying(true);
    }
  }

  // Impression
  const [impressionText, setImpressionText] = useState<string | null>(null);
  const [impressionLoading, setImpressionLoading] = useState(false);
  const isShowingImpression = showImpressionFor === msg.id;

  async function handleImpressionClick() {
    if (isShowingImpression) { onToggleImpression(msg.id); return; }
    if (impressionText) { onToggleImpression(msg.id, impressionText); return; }
    setImpressionLoading(true);
    try {
      const res = await fetch("/api/zakiy/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, sessionId }),
      });
      const data = await res.json();
      const text = data.impression ?? "لسه بتعرف بعضنا — كمّل الحديث وهشوفك أكتر!";
      setImpressionText(text);
      onToggleImpression(msg.id, text);
    } catch {
      const fallback = "مش قدرت أوصلك الانطباع دلوقتي — جرّب تاني بعد شوية.";
      setImpressionText(fallback);
      onToggleImpression(msg.id, fallback);
    } finally {
      setImpressionLoading(false);
    }
  }

  let quranCounter = 0;

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === "quran") {
          const qIdx = quranCounter++;
          return (
            <QuranCard
              key={i}
              seg={seg}
              isActive={quranPlayIdx === qIdx}
              isPlaying={quranPlayIdx === qIdx && quranIsPlaying}
              onEnded={() => handleQuranEnded(qIdx)}
              onManualToggle={() => handleManualToggle(qIdx)}
            />
          );
        }
        if (seg.type === "fatwa") return <FatwaCard key={i} seg={seg} />;
        return <FormattedText key={i} text={seg.text} />;
      })}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {msg.audioBase64 && (
          <button
            onClick={() => onPlay(msg.id, msg.audioBase64!)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all",
              playingId === msg.id
                ? "bg-teal-600 text-white"
                : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100"
            )}
          >
            {playingId === msg.id ? <><Pause size={12} /> إيقاف</> : <><Volume2 size={12} /> استمع</>}
          </button>
        )}

        {msg.id !== "greeting" && (
          <button
            onClick={handleImpressionClick}
            disabled={impressionLoading}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all border",
              isShowingImpression
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-300/60 hover:bg-rose-100"
            )}
          >
            {impressionLoading
              ? <><Loader2 size={12} className="animate-spin" /> لحظة...</>
              : <><Heart size={12} className={isShowingImpression ? "fill-white" : ""} /> انطباعي عنك</>
            }
          </button>
        )}
      </div>

      <AnimatePresence>
        {isShowingImpression && impressionText && (
          <ImpressionPanel impression={impressionText} onClose={() => onToggleImpression(msg.id)} />
        )}
      </AnimatePresence>

      {msg.id !== "greeting" && (
        <SuggestionChips
          suggestions={msg.suggestions ?? []}
          onSelect={onSuggestionSelect}
          loading={msg.suggestionsLoading}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════

export default function ZakiyPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quranReadyId, setQuranReadyId] = useState<string | null>(null);
  const [impressionOpenId, setImpressionOpenId] = useState<string | null>(null);
  const [impressionTexts, setImpressionTexts] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const sessionId = getSessionId();
  const hasUserMessages = messages.some((m) => m.role === "user");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  function buildHistory(): ApiHistory[] {
    return messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.text }));
  }

  function handleToggleImpression(id: string, text?: string) {
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
        prev.map((m) => m.id === msgId ? { ...m, suggestions: data.suggestions ?? [], suggestionsLoading: false } : m)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, suggestions: [], suggestionsLoading: false } : m)
      );
    }
  }

  function addBotMessage(text: string, audioBase64?: string) {
    const msg: Message = {
      id: Date.now().toString(),
      role: "bot",
      text,
      audioBase64,
      timestamp: new Date(),
      suggestions: [],
      suggestionsLoading: true,
    };
    setMessages((prev) => [...prev, msg]);
    if (audioBase64) setTimeout(() => playAudio(msg.id, audioBase64), 600);
    const currentHistory = buildHistory();
    fetchSuggestions([...currentHistory, { role: "assistant", content: text }], msg.id);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { id: Date.now().toString() + "u", role: "user", text, timestamp: new Date() }]);
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
      addBotMessage(data.response, data.audioBase64);
    } catch {
      addBotMessage("(بنبرة آسف) عذراً يا صاحبي، في مشكلة تقنية. جرّب تاني بعد شوية.");
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
      addBotMessage(data.response, data.audioBase64);
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
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        sendVoice(blob);
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

  function playAudio(id: string, base64: string) {
    if (playingId && playingId !== id) audioRefs.current[playingId]?.pause();

    let audio = audioRefs.current[id];
    if (!audio) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mp3" }));
      audio = new Audio(url);
      audioRefs.current[id] = audio;
      audio.onended = () => { setPlayingId(null); setQuranReadyId(id); };
    }

    if (playingId === id && !audio.paused) { audio.pause(); setPlayingId(null); }
    else { audio.play().catch(() => {}); setPlayingId(id); }
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
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">متصل</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex items-end gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
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
                    playingId={playingId}
                    onPlay={playAudio}
                    quranReady={msg.id === quranReadyId}
                    onSuggestionSelect={(q) => sendMessage(q)}
                    sessionId={sessionId}
                    history={buildHistory()}
                    showImpressionFor={impressionOpenId}
                    onToggleImpression={handleToggleImpression}
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}
                <p className="text-[10px] opacity-50 mt-1 text-end">
                  {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
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
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
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
