import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Play, Pause, Volume2, Loader2, Bot, StopCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function misharyUrl(surah: number, ayah: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${toGlobalAyah(surah, ayah)}.mp3`;
}

interface QuranSegment {
  type: "quran";
  surah: number;
  ayah: number;
  text: string;
}
interface TextSegment {
  type: "text";
  text: string;
}
type Segment = QuranSegment | TextSegment;

function parseSegments(raw: string): Segment[] {
  const re = /\{\{quran:(\d+):(\d+)\|([^}]*)\}\}/g;
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      const t = raw.slice(last, match.index).trim();
      if (t) segments.push({ type: "text", text: t });
    }
    segments.push({
      type: "quran",
      surah: Number(match[1]),
      ayah: Number(match[2]),
      text: match[3],
    });
    last = match.index + match[0].length;
  }

  if (last < raw.length) {
    const t = raw.slice(last).trim();
    if (t) segments.push({ type: "text", text: t });
  }

  return segments.length ? segments : [{ type: "text", text: raw }];
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  audioBase64?: string;
  timestamp: Date;
}

interface ApiHistory {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  id: "greeting",
  role: "bot",
  text: "أهلاً بك، أنا البوت الزكي 🌿\n\nرفيقك في هذه الرحلة الروحانية. سواء أردت أن تبوح بما في قلبك، أو تحتاج كلمة تثبيت وأمل — أنا هنا أستمع إليك بكل قلبي.\n\nتكلّم بحرية كاملة، ولا تحتجز شيئاً.",
  timestamp: new Date(),
};

function QuranCard({ seg }: { seg: QuranSegment }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    const url = misharyUrl(seg.surah, seg.ayah);
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  return (
    <div className="my-2 rounded-xl border border-amber-400/60 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
          <BookOpen size={13} />
          <span className="text-[10px] font-bold tracking-wide">آية قرآنية</span>
        </div>
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all font-medium",
            playing
              ? "bg-amber-500 text-white"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
          )}
        >
          {playing ? <><Pause size={10} /> إيقاف</> : <><Play size={10} /> مشاري</>}
        </button>
      </div>
      <p className="text-base leading-loose font-arabic text-right text-amber-900 dark:text-amber-200">
        ﴿{seg.text}﴾
      </p>
    </div>
  );
}

function BotMessageBody({ text, audioBase64, msgId, playingId, onPlay }: {
  text: string;
  audioBase64?: string;
  msgId: string;
  playingId: string | null;
  onPlay: (id: string, b64: string) => void;
}) {
  const segments = parseSegments(text);

  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === "quran" ? (
          <QuranCard key={i} seg={seg} />
        ) : (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{seg.text}</p>
        )
      )}

      {audioBase64 && (
        <button
          onClick={() => onPlay(msgId, audioBase64)}
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all",
            playingId === msgId
              ? "bg-teal-600 text-white"
              : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100"
          )}
        >
          {playingId === msgId ? <><Pause size={12} /> إيقاف</> : <><Volume2 size={12} /> استمع</>}
        </button>
      )}
    </div>
  );
}

export default function ZakiyPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  function buildHistory(): ApiHistory[] {
    return messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
  }

  function addBotMessage(text: string, audioBase64?: string) {
    const msg: Message = {
      id: Date.now().toString(),
      role: "bot",
      text,
      audioBase64,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    if (audioBase64) {
      setTimeout(() => playAudio(msg.id, audioBase64), 600);
    }
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
        body: JSON.stringify({ message: text.trim(), history }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      addBotMessage(data.response, data.audioBase64);
    } catch {
      addBotMessage("عذراً، حدث خطأ ما. حاول مجدداً بعد لحظة.");
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
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const res = await fetch("/api/zakiy/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, history }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      addUserMessage(data.transcript || "🎤 رسالة صوتية");
      addBotMessage(data.response, data.audioBase64);
    } catch {
      addBotMessage("لم أتمكن من فهم التسجيل. حاول مجدداً أو اكتب رسالتك.");
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        sendVoice(new Blob(audioChunksRef.current, { type: mr.mimeType || "audio/webm" }));
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
      audio.onended = () => setPlayingId(null);
    }

    if (playingId === id && !audio.paused) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.play().catch(() => {});
      setPlayingId(id);
    }
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">البوت الزكي</h1>
          <p className="text-xs text-muted-foreground">رفيقك الروحاني دائماً معك</p>
        </div>
        <div className="mr-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">متصل</span>
        </div>
      </div>

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

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tl-sm"
                    : "bg-card border border-border/60 text-foreground rounded-tr-sm"
                )}
              >
                {msg.role === "bot" ? (
                  <BotMessageBody
                    text={msg.text}
                    audioBase64={msg.audioBase64}
                    msgId={msg.id}
                    playingId={playingId}
                    onPlay={playAudio}
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
              placeholder="اكتب ما في قلبك..."
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
          ما تكتبه هنا آمن ومحفوظ بيننا فقط
        </p>
      </div>
    </div>
  );
}
