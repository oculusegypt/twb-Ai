import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Play, Pause, Volume2, Loader2, Bot, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  audioBase64?: string;
  isPlaying?: boolean;
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    return msg.id;
  }

  function addUserMessage(text: string) {
    const msg: Message = {
      id: Date.now().toString() + "u",
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
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

      if (!res.ok) throw new Error("Failed");
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
      const audioBase64 = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const res = await fetch("/api/zakiy/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, history }),
      });

      if (!res.ok) throw new Error("Failed");
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

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
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
    if (playingId && playingId !== id) {
      audioRefs.current[playingId]?.pause();
    }

    let audio = audioRefs.current[id];
    if (!audio) {
      const blob = base64ToBlob(base64, "audio/mp3");
      const url = URL.createObjectURL(blob);
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

  function base64ToBlob(base64: string, type: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
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
              className={cn(
                "flex items-end gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "bot" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mb-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tl-sm"
                    : "bg-card border border-border/60 text-foreground rounded-tr-sm"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.role === "bot" && msg.audioBase64 && (
                  <button
                    onClick={() => playAudio(msg.id, msg.audioBase64!)}
                    className={cn(
                      "mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all",
                      playingId === msg.id
                        ? "bg-teal-600 text-white"
                        : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50"
                    )}
                  >
                    {playingId === msg.id ? (
                      <><Pause size={12} /> إيقاف</>
                    ) : (
                      <><Volume2 size={12} /> استمع</>
                    )}
                  </button>
                )}

                <p className="text-[10px] opacity-50 mt-1 text-end">
                  {msg.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl rounded-tr-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
              recording
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {recording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
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
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="scale-x-[-1]" />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
          ما تكتبه هنا آمن ومحفوظ بيننا فقط
        </p>
      </div>
    </div>
  );
}
