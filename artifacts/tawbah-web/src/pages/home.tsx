import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Heart, Activity, CircleDot, HeartHandshake, BookOpen, PenLine, ScrollText, Clock, BarChart2, Sparkles, ListChecks, ImageIcon, Swords, Globe, Users, CalendarDays, Bell, HandHeart, Moon, Sun, Star, BookMarked, MessageCircle, Volume2, X, BookText, Share2, GripVertical, Settings2, Flame, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { LiveStats } from "@/components/live-stats";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useAppNotifications } from "@/context/AppNotificationsContext";
import { IslamicHero } from "@/components/IslamicHero";
import { getEidStatus } from "@/lib/eid-utils";
import { getSessionId } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ───────────────────────────────────────────────────────────────────

type BannerType = "season" | "nafl" | "ayah" | "hadith" | "dua" | "wisdom";
type AyahRef = { surah: number; ayah: number };
type BannerItem = {
  type: BannerType;
  label: string;
  content: string;
  icon: "sparkles" | "moon" | "sun" | "star" | "book" | "chat";
  seasonColor?: string;
  ayahRef?: AyahRef;
  tafsir?: string;
};

// ─── Section IDs ─────────────────────────────────────────────────────────────

type GridId =
  | "rajaa"
  | "dhikr"
  | "journal"
  | "hadi-tasks"
  | "dhikr-rooms"
  | "challenge"
  | "kaffarah"
  | "prayer-times"
  | "relapse"
  | "progress-map";

type ListId =
  | "journey30"
  | "invite"
  | "ameen"
  | "notifications"
  | "danger-times"
  | "secret-dua"
  | "tawbah-card"
  | "signs"
  | "map"
  | "live-stats";

type SectionId = GridId | ListId;

const GRID_DEFAULT: GridId[] = [
  "rajaa", "dhikr", "journal", "hadi-tasks",
  "dhikr-rooms", "challenge", "kaffarah", "prayer-times",
  "relapse", "progress-map",
];

const LIST_DEFAULT: ListId[] = [
  "journey30", "invite", "ameen", "notifications",
  "danger-times", "secret-dua", "tawbah-card", "signs",
  "map", "live-stats",
];

const GRID_STORAGE_KEY = "home_grid_order_v1";
const LIST_STORAGE_KEY = "home_list_order_v1";

function loadGridOrder(): GridId[] {
  try {
    const saved = localStorage.getItem(GRID_STORAGE_KEY);
    if (saved) {
      const parsed: GridId[] = JSON.parse(saved);
      const valid = parsed.filter((id) => GRID_DEFAULT.includes(id));
      const missing = GRID_DEFAULT.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return GRID_DEFAULT;
}

function loadListOrder(): ListId[] {
  try {
    const saved = localStorage.getItem(LIST_STORAGE_KEY);
    if (saved) {
      const parsed: ListId[] = JSON.parse(saved);
      const valid = parsed.filter((id) => LIST_DEFAULT.includes(id));
      const missing = LIST_DEFAULT.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return LIST_DEFAULT;
}

function saveGridOrder(order: GridId[]) {
  try { localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(order)); } catch {}
}

function saveListOrder(order: ListId[]) {
  try { localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(order)); } catch {}
}

// ─── Grid card metadata ───────────────────────────────────────────────────────

type GridCardMeta = {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
};

const GRID_META: Record<GridId, GridCardMeta> = {
  "rajaa":        { href: "/rajaa",        label: "مكتبة الرجاء",    sub: "آيات وأحاديث",      icon: <BookOpen size={22} />,    bg: "from-primary/10 to-primary/5",        border: "border-primary/20",      iconBg: "bg-primary/10 text-primary" },
  "dhikr":        { href: "/dhikr",        label: "مسبحة الذكر",     sub: "استغفار وتسبيح",    icon: <CircleDot size={22} />,   bg: "from-secondary/10 to-secondary/5",    border: "border-border",           iconBg: "bg-secondary/10 text-secondary-foreground" },
  "journal":      { href: "/journal",      label: "يوميات التوبة",   sub: "مساحة سرية",        icon: <PenLine size={22} />,     bg: "from-violet-500/10 to-violet-400/5",  border: "border-violet-400/25",    iconBg: "bg-violet-500/10 text-violet-500" },
  "hadi-tasks":   { href: "/hadi-tasks",   label: "مهام هادي",       sub: "نصائح الزكي",       icon: <ListChecks size={22} />,  bg: "from-emerald-500/10 to-emerald-400/5",border: "border-emerald-300/40",   iconBg: "bg-emerald-500/10 text-emerald-600" },
  "dhikr-rooms":  { href: "/dhikr-rooms",  label: "غرف الذكر",       sub: "مع آلاف المسلمين",  icon: <Users size={22} />,       bg: "from-teal-500/10 to-teal-400/5",      border: "border-teal-400/25",      iconBg: "bg-teal-500/10 text-teal-600" },
  "challenge":    { href: "/challenge/create", label: "تحدي التوبة", sub: "شارك رابطه",        icon: <Swords size={22} />,      bg: "from-emerald-500/10 to-emerald-400/5",border: "border-emerald-400/25",   iconBg: "bg-emerald-500/10 text-emerald-700" },
  "kaffarah":     { href: "/kaffarah",     label: "الكفارات",        sub: "خطوات مفصّلة",      icon: <ScrollText size={22} />,  bg: "from-destructive/5 to-destructive/0", border: "border-destructive/20",   iconBg: "bg-destructive/10 text-destructive" },
  "prayer-times": { href: "/prayer-times", label: "مواقيت الصلاة",  sub: "تذكيرات ذكية",      icon: <Clock size={22} />,       bg: "from-indigo-500/10 to-indigo-400/5",  border: "border-indigo-300/40",    iconBg: "bg-indigo-500/10 text-indigo-500" },
  "relapse":      { href: "/relapse",      label: "ضعفت وعدت؟",     sub: "لا تيأس",           icon: <Heart size={22} />,       bg: "from-rose-500/10 to-rose-400/5",      border: "border-rose-400/25",      iconBg: "bg-rose-500/10 text-rose-500" },
  "progress-map": { href: "/progress",     label: "خريطة التقدم",   sub: "إحصاءاتك",          icon: <BarChart2 size={22} />,   bg: "from-blue-500/10 to-blue-400/5",      border: "border-blue-400/25",      iconBg: "bg-blue-500/10 text-blue-500" },
};

// ─── Banner data ──────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<BannerType, { gradient: string; border: string; iconColor: string }> = {
  ayah:    { gradient: "from-emerald-600/20 to-emerald-300/5",    border: "border-emerald-500/20",  iconColor: "text-emerald-600" },
  hadith:  { gradient: "from-amber-500/20 to-amber-300/5",        border: "border-amber-400/20",    iconColor: "text-amber-600" },
  nafl:    { gradient: "from-indigo-600/20 to-blue-400/5",        border: "border-indigo-400/20",   iconColor: "text-indigo-500" },
  dua:     { gradient: "from-violet-600/20 to-purple-300/5",      border: "border-violet-400/20",   iconColor: "text-violet-600" },
  wisdom:  { gradient: "from-rose-500/20 to-pink-300/5",          border: "border-rose-400/20",     iconColor: "text-rose-500" },
  season:  { gradient: "from-teal-500/20 to-emerald-300/5",       border: "border-teal-400/20",     iconColor: "text-teal-600" },
};

const BANNER_POOL: BannerItem[] = [
  { type: "ayah",   label: "آية كريمة",        icon: "book",     content: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ﴾ — الزمر: 53", ayahRef: { surah: 39, ayah: 53 }, tafsir: "قل يا محمد لعبادي الذين أكثروا من الذنوب والمعاصي: لا تيأسوا من رحمة الله ومغفرته، فإن الله يغفر الذنوب جميعًا لمن تاب وأناب — صغيرها وكبيرها. إنه هو الغفور الذي يستر الذنوب، الرحيم الذي يعطف على عباده التائبين. هذه الآية هي أوسع آية في القرآن في باب الرحمة والمغفرة." },
  { type: "hadith", label: "حديث شريف",        icon: "chat",     content: "«إنَّ اللهَ يَقبلُ توبةَ العبدِ ما لم يُغَرْغِر» — رواه الترمذي" },
  { type: "nafl",   label: "تذكير بالنوافل",   icon: "sun",      content: "صلاة الضحى ركعتان — تُصلَّى بعد شروق الشمس بربع ساعة حتى قُبيل الظهر. لا تفوّتها!" },
  { type: "dua",    label: "دعاء مأثور",       icon: "star",     content: "«اللهم إني أعوذ بك من الهمّ والحزن، وأعوذ بك من العجز والكسل، وأعوذ بك من الجبن والبخل»" },
  { type: "wisdom", label: "عبرة ونصيحة",      icon: "sparkles", content: "الذنب الذي يُورِث الإنكسار خير من طاعة تُورِث الكِبر — ابن عطاء الله السكندري" },
  { type: "nafl",   label: "نافلة الليل",      icon: "moon",     content: "قيام الليل ولو بركعتين — أفضل الصلاة بعد المكتوبة. الله ينزل في الثلث الأخير فهل ستناديه؟" },
  { type: "ayah",   label: "آية كريمة",        icon: "book",     content: "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: 110", ayahRef: { surah: 4, ayah: 110 }, tafsir: "ومن يرتكب ذنبًا أو يضر نفسه بالمعصية والخطيئة — ثم يرجع إلى الله ويطلب مغفرته — يجد الله غفورًا يمحو ذنوبه ويسترها، رحيمًا لا يعاجله بالعقوبة. فالباب مفتوح لكل عبد عاد." },
  { type: "hadith", label: "حديث شريف",        icon: "chat",     content: "«التائبُ مِنَ الذنبِ كمَنْ لا ذنبَ له» — رواه ابن ماجه" },
  { type: "wisdom", label: "نصيحة روحية",      icon: "sparkles", content: "كلما ازداد إحساسك بالذنب ازداد دليلاً على يقظة قلبك — فلا تيأس، بل تب وأقبِل." },
  { type: "nafl",   label: "سنة مؤكدة",        icon: "sun",      content: "السنن الرواتب الـ12: ركعتان قبل الفجر، 4 قبل الظهر، 2 بعده، 2 بعد المغرب، 2 بعد العشاء — من داوم عليها بُنِي له بيت في الجنة." },
  { type: "dua",    label: "دعاء التوبة",      icon: "star",     content: "«اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي» — سيد الاستغفار" },
  { type: "ayah",   label: "آية كريمة",        icon: "book",     content: "﴿وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَى﴾ — طه: 82", ayahRef: { surah: 20, ayah: 82 }, tafsir: "وإني — الله — لكثير المغفرة والعفو لمن تاب عن ذنبه وآمن بي إيمانًا صادقًا وعمل الصالحات بعد توبته ثم ثبت على الهداية واستقام عليها ولم يرتد عنها. فالتوبة الصادقة تجمع أربعة: الرجوع، والإيمان، والعمل، والاستقامة." },
  { type: "nafl",   label: "صيام النوافل",     icon: "moon",     content: "الاثنين والخميس — أيام تُعرَض فيها الأعمال على الله. أحبّ أن يُعرَض عملي وأنا صائم." },
  { type: "wisdom", label: "فائدة إيمانية",    icon: "sparkles", content: "أعظم ما تفعله بعد المعصية: أن تسارع للصلاة والاستغفار فور السقوط — لا تمكّن الشيطان من إقناعك بالتأجيل." },
];

function getSeasonBanner(): BannerItem | null {
  const eid = getEidStatus();
  if (eid.period === "eid_fitr")
    return { type: "season", label: "🌙 عيد الفطر المبارك", content: `عيد فطر مبارك — تقبّل الله منا ومنكم. اليوم ${eid.eidDay === 1 ? "الأول" : eid.eidDay === 2 ? "الثاني" : "الثالث"} من أيام العيد.`, icon: "star", seasonColor: "from-violet-600/25 to-purple-300/5 border-violet-400/25" };
  if (eid.period === "eid_adha")
    return { type: "season", label: "🐑 عيد الأضحى المبارك", content: `عيد أضحى مبارك — تقبّل الله منا ومنكم. اليوم ${eid.eidDay === 1 ? "الأول" : eid.eidDay === 2 ? "الثاني" : "الثالث"} من أيام العيد.`, icon: "star", seasonColor: "from-emerald-600/25 to-teal-300/5 border-emerald-400/25" };
  if (eid.period === "pre_fitr") {
    const d = eid.daysUntilEid;
    return { type: "season", label: "🌙 العيد على الأبواب", content: `عيد الفطر ${d === 1 ? "غداً" : `بعد ${d} أيام`} — أخرج زكاة الفطر وابدأ التكبير وتهيّأ بخير.`, icon: "moon", seasonColor: "from-violet-600/25 to-purple-300/5 border-violet-400/25" };
  }
  if (eid.period === "arafah")
    return { type: "season", label: "🤲 يوم عرفة — اليوم", content: "أعظم يوم يُعتَق فيه الناس من النار. صُم وأكثر من الدعاء والاستغفار — غداً عيد الأضحى.", icon: "star", seasonColor: "from-amber-600/25 to-yellow-300/5 border-amber-400/25" };
  if (eid.period === "pre_adha_dhul_hijja") {
    const d = eid.daysUntilEid;
    return { type: "season", label: "✨ العشر من ذي الحجة", content: `أفضل أيام السنة — صيامٌ وذكرٌ وتوبة. عيد الأضحى ${d === 1 ? "غداً" : `بعد ${d} أيام`}.`, icon: "sparkles", seasonColor: "from-amber-600/25 to-yellow-400/5 border-amber-500/25" };
  }
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayOfWeek = now.getDay();
  if (month === 3 && day >= 10 && day <= 19)
    return { type: "season", label: "رمضان يودّعنا", content: "اغتنم ما بقي من رمضان — هي لحظات. العشر الأواخر فرصة لا تتكرر.", icon: "moon", seasonColor: "from-emerald-600/25 to-teal-400/5 border-emerald-500/25" };
  if (month === 8 && day >= 1 && day <= 15)
    return { type: "season", label: "شعبان — شهر رفع الأعمال", content: "أعمالك تُرفَع إلى الله قبل رمضان. ابدأ الاستعداد من الآن بصفحة نظيفة.", icon: "moon", seasonColor: "from-purple-600/25 to-violet-400/5 border-purple-400/25" };
  if (month === 1 || month === 2)
    return { type: "season", label: "الأشهر الحرم", content: "ذو القعدة وذو الحجة والمحرم ورجب — أشهر عظّمها الله. الحسنات مضاعفة والسيئات مثقّلة.", icon: "sparkles", seasonColor: "from-sky-600/25 to-blue-400/5 border-sky-400/25" };
  if (dayOfWeek === 5)
    return { type: "season", label: "يوم الجمعة المبارك", content: "أكثر من الصلاة على النبي ﷺ اليوم — اقرأ سورة الكهف وادعُ في ساعة الإجابة.", icon: "sun", seasonColor: "from-green-600/25 to-emerald-400/5 border-green-400/25" };
  return null;
}

const ICON_MAP = {
  sparkles: Sparkles, moon: Moon, sun: Sun, star: Star, book: BookMarked, chat: MessageCircle,
};

// ─── TafsirSheet ─────────────────────────────────────────────────────────────

function TafsirSheet({ item, onClose }: { item: BannerItem; onClose: () => void }) {
  const styles = TYPE_STYLES[item.type];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
          </div>
          <div className={`flex items-center justify-between px-5 py-3 bg-gradient-to-r ${styles.gradient} border-b ${styles.border}`}>
            <div className="flex items-center gap-2">
              <BookText size={16} className={styles.iconColor} />
              <span className={`font-bold text-sm ${styles.iconColor}`}>التفسير الميسر</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-background/60 hover:bg-background/90 transition-colors">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground leading-loose text-center font-arabic mb-3">{item.content}</p>
            <div className="h-px bg-border/60 my-3" />
            <p className="text-sm text-foreground/80 leading-relaxed text-right" dir="rtl">{item.tafsir}</p>
          </div>
          <div className="px-5 py-4 flex justify-end">
            <button onClick={onClose} className={`px-5 py-2 rounded-xl text-xs font-bold ${styles.iconColor} bg-gradient-to-r ${styles.gradient} border ${styles.border}`}>
              حفظ الله قلبك
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── DynamicBanner ────────────────────────────────────────────────────────────

function DynamicBanner() {
  const seasonBanner = getSeasonBanner();
  const { quranReciterId } = useSettings();
  const getPoolIndex = () => {
    const slotMinutes = 30;
    const slotIndex = Math.floor(Date.now() / (slotMinutes * 60 * 1000));
    return slotIndex % BANNER_POOL.length;
  };
  const [poolIndex, setPoolIndex] = useState(getPoolIndex);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [showSeason, setShowSeason] = useState(!!seasonBanner);
  const [showTafsir, setShowTafsir] = useState(false);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => { setPoolIndex(getPoolIndex()); setManualIndex(null); }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setAudioState("idle"); setShowTafsir(false);
  }, [poolIndex, manualIndex, showSeason]);

  const currentItem: BannerItem = showSeason && seasonBanner ? seasonBanner : BANNER_POOL[manualIndex !== null ? manualIndex : poolIndex];
  const IconComp = ICON_MAP[currentItem.icon];
  const handleNext = () => {
    if (showSeason) { setShowSeason(false); setManualIndex(poolIndex); }
    else { const next = ((manualIndex !== null ? manualIndex : poolIndex) + 1) % BANNER_POOL.length; setManualIndex(next); }
  };
  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem.ayahRef) return;
    if (audioState === "playing" && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setAudioState("idle"); return; }
    setAudioState("loading");
    try {
      const { surah, ayah } = currentItem.ayahRef;
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${quranReciterId}`);
      const json = await res.json();
      const audioUrl: string = json?.data?.audio;
      if (!audioUrl) throw new Error("No audio URL");
      const audio = new Audio(audioUrl);
      audioRef.current = audio; audio.play(); setAudioState("playing");
      audio.onended = () => setAudioState("idle"); audio.onerror = () => setAudioState("idle");
    } catch { setAudioState("idle"); }
  };
  const styles = TYPE_STYLES[currentItem.type];
  const gradientClass = currentItem.type === "season" && currentItem.seasonColor ? currentItem.seasonColor : `${styles.gradient} ${styles.border}`;
  const isAyah = currentItem.type === "ayah" && !!currentItem.ayahRef;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.label + currentItem.content.slice(0, 20)}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className={`bg-gradient-to-r ${gradientClass} rounded-2xl p-4 border shadow-sm cursor-pointer select-none`}
          onClick={handleNext}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <IconComp size={15} className={`${styles.iconColor} shrink-0`} />
              <span className={`font-bold text-xs ${styles.iconColor}`}>{currentItem.label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">اضغط للتالي ›</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{currentItem.content}</p>
          {isAyah && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-current/10" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleListen} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${audioState === "playing" ? "bg-emerald-500 text-white shadow-md" : "bg-background/70 hover:bg-background text-foreground/80 border border-current/10"}`}>
                {audioState === "loading" ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" /> : <Volume2 size={12} className={audioState === "playing" ? "animate-pulse" : ""} />}
                {audioState === "playing" ? "إيقاف" : "استمع"}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowTafsir(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-background/70 hover:bg-background text-foreground/80 border border-current/10 transition-all">
                <BookText size={12} />تفسير ميسر
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {showTafsir && currentItem.tafsir && <TafsirSheet item={currentItem} onClose={() => setShowTafsir(false)} />}
    </>
  );
}

// ─── InviteFriendCard ─────────────────────────────────────────────────────────

function InviteFriendCard() {
  const [shared, setShared] = useState(false);
  const handleInvite = async () => {
    const text = "اكتشفت تطبيقاً يساعدك على التوبة الصادقة 🌿\nرحلة 30 يوماً مع خطة يومية وذكر وإرشاد روحي.\n\nابدأ رحلتك الآن 👇";
    const url = window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: "دليل التوبة النصوح", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      setShared(true); setTimeout(() => setShared(false), 2500);
    }
  };
  return (
    <button onClick={handleInvite} className="w-full flex items-center gap-4 bg-gradient-to-l from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all text-right">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
        <HeartHandshake size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ادعُ رفيقاً في رحلة التوبة</h3>
        <p className="text-[11px] text-muted-foreground">شارك التطبيق — الدال على الخير كفاعله</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {shared ? <span className="text-xs font-bold text-primary">تم! ✓</span> : <Share2 size={16} className="text-primary" />}
      </div>
    </button>
  );
}

// ─── EidEntryCard ─────────────────────────────────────────────────────────────

function EidEntryCard() {
  const eid = getEidStatus();
  const dismissKey = `eid_banner_dismissed_${eid.period}`;
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(dismissKey) === "1"; } catch { return false; } });
  if (!eid.isActive && (eid.daysUntilEid === null || eid.daysUntilEid > 14)) return null;
  if (dismissed) return null;
  const isEidDay = eid.period === "eid_fitr" || eid.period === "eid_adha";
  const isAdha = eid.eidType === "adha";
  const isPreAdha = eid.period === "pre_adha_dhul_hijja" || eid.period === "arafah";
  const gradientClass = isAdha ? "from-emerald-600/15 to-teal-500/5 border-emerald-500/30" : "from-violet-600/15 to-purple-500/5 border-violet-400/30";
  const iconBg = isAdha ? "bg-emerald-500" : "bg-violet-600";
  const title = isEidDay ? (isAdha ? "عيد الأضحى المبارك 🐑" : "عيد الفطر المبارك 🌙") : eid.period === "arafah" ? "يوم عرفة اليوم 🤲" : isPreAdha ? `العشر من ذي الحجة — ${eid.daysUntilEid === 1 ? "العيد غداً" : `العيد بعد ${eid.daysUntilEid} أيام`}` : `العيد ${eid.daysUntilEid === 1 ? "غداً" : `بعد ${eid.daysUntilEid} أيام`} 🌙`;
  const subtitle = isEidDay ? "تقبّل الله منا ومنكم — اضغط لصفحة العيد الكاملة" : eid.period === "arafah" ? "صُم واستغفر وادعُ — اكتشف صفحة العيد" : isPreAdha ? "أفضل أيام السنة — أكثر من الطاعة والتوبة" : "استعد وأخرج زكاة الفطر — اكتشف صفحة العيد";
  const handleDismiss = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); try { localStorage.setItem(dismissKey, "1"); } catch {} };
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.35 }}
          className={`flex items-center gap-3 bg-gradient-to-l ${gradientClass} border rounded-2xl p-3.5 shadow-sm`}>
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-md shrink-0`}>
            <span className="text-lg">{isAdha ? "🐑" : isPreAdha ? "✨" : "🌙"}</span>
          </div>
          <Link href="/eid" className="flex-1 min-w-0 active:opacity-70 transition-opacity">
            <h3 className="font-bold text-sm leading-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/eid" className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors" aria-label="الذهاب لصفحة العيد"><ArrowLeft size={15} /></Link>
            <button onClick={handleDismiss} className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors" aria-label="إغلاق"><X size={14} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── HeroBellButton ───────────────────────────────────────────────────────────

function HeroBellButton() {
  const [, setLocation] = useLocation();
  const { unreadCount } = useAppNotifications();
  return (
    <button onClick={() => setLocation("/inbox")} aria-label="صندوق الإشعارات"
      className="absolute top-3 left-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 active:scale-95 transition-all">
      <Bell size={20} className="text-white drop-shadow" />
      {unreadCount > 0 && (
        <motion.span key={unreadCount} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </button>
  );
}

// ─── SosReturnToast ───────────────────────────────────────────────────────────

function SosReturnToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto">
      <div className="bg-emerald-600 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3" onClick={onDismiss}>
        <span className="text-xl shrink-0">🌿</span>
        <div className="flex-1"><p className="font-bold text-sm">أحسنت — الله يثبّتك</p><p className="text-emerald-100 text-xs">قاومت ونجحت. استمر في رحلتك.</p></div>
        <button onClick={onDismiss} className="text-white/70 hover:text-white text-lg leading-none">×</button>
      </div>
    </motion.div>
  );
}

// ─── Journey30 Hero Card ──────────────────────────────────────────────────────

interface Journey30Summary {
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

function Journey30HeroCard() {
  const sessionId = getSessionId();
  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-home", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/journey30?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      return { completedCount: data.completedCount, currentDay: data.currentDay, streakDays: data.streakDays };
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  });

  const completed = j30?.completedCount ?? 0;
  const currentDay = j30?.currentDay ?? 1;
  const progress = Math.round((completed / 30) * 100);
  const isFinished = completed >= 30;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">رحلة الـ ٣٠ يوماً</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isFinished
              ? "🎉 أتممت الرحلة — بارك الله فيك"
              : `أنت في اليوم `}
            {!isFinished && <span className="text-primary font-bold">{currentDay}</span>}
          </p>
        </div>
        <div className="relative w-[58px] h-[58px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 58 58">
            <circle cx="29" cy="29" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary/10" />
            <circle
              cx="29" cy="29" r="24" fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-primary leading-none">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <Flame size={11} className="text-orange-500" />
            {completed} يوم مكتمل
          </span>
          <span>{30 - completed} يوم متبقٍ</span>
        </div>
        <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href="/journey"
        className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
      >
        {isFinished ? (
          <>
            <TrendingUp size={17} />
            <span>استعرض إنجازك</span>
          </>
        ) : (
          <>
            <span>متابعة مهام اليوم {currentDay}</span>
            <ArrowLeft size={17} />
          </>
        )}
      </Link>
    </div>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function SectionTawbahCard() {
  return (
    <Link href="/card" className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-primary/10 border border-amber-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0"><ImageIcon size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">بطاقة توبتي</h3><p className="text-[11px] text-muted-foreground">اصنع بطاقة جميلة وشاركها مع الناس</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionChallenge() {
  return (
    <Link href="/challenge/create" className="flex items-center gap-4 bg-gradient-to-l from-emerald-500/10 to-primary/10 border border-emerald-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shrink-0"><Swords size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">تحدي التوبة</h3><p className="text-[11px] text-muted-foreground">ابدأ تحدياً وشارك رابطه — ليدعو لك الناس</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionMap() {
  return (
    <Link href="/map" className="flex items-center gap-4 bg-gradient-to-l from-blue-500/10 to-primary/10 border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0"><Globe size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">خريطة التوبة العالمية</h3><p className="text-[11px] text-muted-foreground">من أي دول يتوب المسلمون الآن؟</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionJourney30() {
  return (
    <Link href="/journey" className="flex items-center gap-4 bg-gradient-to-l from-violet-500/10 to-primary/10 border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0"><CalendarDays size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">رحلة ٣٠ يوماً</h3><p className="text-[11px] text-muted-foreground">برنامج تدريجي يومي للتوبة والاستقامة</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDhikrRooms() {
  return (
    <Link href="/dhikr-rooms" className="flex items-center gap-4 bg-gradient-to-l from-teal-500/10 to-primary/10 border border-teal-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0"><Users size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">غرف الذكر الجماعي</h3><p className="text-[11px] text-muted-foreground">سبّح مع آلاف المسلمين الآن</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionAmeen() {
  return (
    <Link href="/ameen" className="flex items-center gap-4 bg-gradient-to-l from-rose-500/10 to-pink-500/5 border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md shrink-0"><HandHeart size={20} className="text-white" /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">قل آمين 🤲</h3><p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول — وقل آمين لدعائه</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionInvite() {
  return <InviteFriendCard />;
}

function SectionLiveStats() {
  return <LiveStats />;
}

function SectionKaffarah() {
  return (
    <Link href="/kaffarah" className="flex items-center gap-4 bg-card border border-destructive/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 text-destructive"><ScrollText size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">الكفارات الشرعية</h3><p className="text-[11px] text-muted-foreground">خطوات مفصّلة لكل ذنب</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionRajaa() {
  return (
    <Link href="/rajaa" className="flex items-center gap-4 bg-card border border-primary/20 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary"><BookOpen size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">مكتبة الرجاء</h3><p className="text-[11px] text-muted-foreground">آيات وأحاديث وقصص تبعث الأمل</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDhikr() {
  return (
    <Link href="/dhikr" className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 text-secondary-foreground"><CircleDot size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">مسبحة الذكر</h3><p className="text-[11px] text-muted-foreground">استغفار وتسبيح بين يديك</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionSigns() {
  return (
    <Link href="/signs" className="flex items-center gap-4 bg-card border border-green-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 text-green-500"><HeartHandshake size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">تباشير القبول</h3><p className="text-[11px] text-muted-foreground">علامات قبول التوبة الصادقة</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionJournal() {
  return (
    <Link href="/journal" className="flex items-center gap-4 bg-card border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500"><PenLine size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">يوميات التوبة</h3><p className="text-[11px] text-muted-foreground">مساحة سرية خاصة بك</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionProgressMap() {
  return (
    <Link href="/progress" className="flex items-center gap-4 bg-card border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500"><BarChart2 size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">خريطة التقدم</h3><p className="text-[11px] text-muted-foreground">إحصاءاتك الروحية ومسيرتك</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionDangerTimes() {
  return (
    <Link href="/danger-times" className="flex items-center gap-4 bg-card border border-orange-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500"><Clock size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">أوقات الخطر</h3><p className="text-[11px] text-muted-foreground">تذكيرات وقائية ذكية</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionRelapse() {
  return (
    <Link href="/relapse" className="flex items-center gap-4 bg-card border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500"><Heart size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">ضعفت وعدت؟</h3><p className="text-[11px] text-muted-foreground">اقرأ هذا فوراً — لا تيأس</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionHadiTasks() {
  return (
    <Link href="/hadi-tasks" className="flex items-center gap-4 bg-card border border-emerald-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600"><ListChecks size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">مهام هادي</h3><p className="text-[11px] text-muted-foreground">نصائح الزكي تتحول لمهام تتابعها</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionSecretDua() {
  return (
    <Link href="/secret-dua" className="flex items-center gap-4 bg-card border border-rose-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-500"><Heart size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">الصديق السري</h3><p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول بلا أسماء</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionPrayerTimes() {
  return (
    <Link href="/prayer-times" className="flex items-center gap-4 bg-card border border-indigo-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500"><Clock size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">مواقيت الصلاة</h3><p className="text-[11px] text-muted-foreground">تذكيرات ذكية قبل كل صلاة</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

function SectionNotifications() {
  return (
    <Link href="/notifications" className="flex items-center gap-4 bg-card border border-amber-300/40 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all">
      <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500"><Bell size={20} /></div>
      <div className="flex-1"><h3 className="font-bold text-sm">الإشعارات</h3><p className="text-[11px] text-muted-foreground">ضبط تنبيهات الصلاة والأذكار</p></div>
      <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

// ─── Section label map ────────────────────────────────────────────────────────

const SECTION_LABELS: Record<ListId, string> = {
  "journey30":     "رحلة ٣٠ يوماً",
  "invite":        "ادعُ رفيقاً",
  "ameen":         "قل آمين",
  "notifications": "الإشعارات",
  "danger-times":  "أوقات الخطر",
  "secret-dua":    "الصديق السري",
  "tawbah-card":   "بطاقة توبتي",
  "signs":         "تباشير القبول",
  "map":           "خريطة التوبة",
  "live-stats":    "إحصاءات حية",
};

function renderSection(id: ListId) {
  switch (id) {
    case "journey30":     return <SectionJourney30 />;
    case "invite":        return <SectionInvite />;
    case "ameen":         return <SectionAmeen />;
    case "notifications": return <SectionNotifications />;
    case "danger-times":  return <SectionDangerTimes />;
    case "secret-dua":    return <SectionSecretDua />;
    case "tawbah-card":   return <SectionTawbahCard />;
    case "signs":         return <SectionSigns />;
    case "map":           return <SectionMap />;
    case "live-stats":    return <SectionLiveStats />;
  }
}

// ─── SortableListItem ─────────────────────────────────────────────────────────

function SortableListItem({ id, editMode, children }: { id: ListId; editMode: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {editMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 -right-1 z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} className="text-primary/70" />
        </motion.div>
      )}
      <div className={editMode ? "pr-11 transition-all" : "transition-all"}>{children}</div>
    </div>
  );
}

// ─── SortableGridItem ─────────────────────────────────────────────────────────

function SortableGridItem({ id, editMode }: { id: GridId; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const meta = GRID_META[id];
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Link
        href={meta.href}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${meta.bg} border ${meta.border} rounded-2xl p-3.5 hover:shadow-md active:scale-[0.97] transition-all aspect-square text-center`}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
          {meta.icon}
        </div>
        <div>
          <p className="font-bold text-[12px] leading-tight">{meta.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{meta.sub}</p>
        </div>
      </Link>
      {editMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          {...attributes}
          {...listeners}
          className="absolute top-1.5 right-1.5 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={13} className="text-primary/70" />
        </motion.div>
      )}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: progress, isLoading } = useAppUserProgress();
  const [showSosToast, setShowSosToast] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Separate orders for grid and list
  const [gridOrder, setGridOrder] = useState<GridId[]>(loadGridOrder);
  const [listOrder, setListOrder] = useState<ListId[]>(loadListOrder);
  const [activeGridId, setActiveGridId] = useState<GridId | null>(null);
  const [activeListId, setActiveListId] = useState<ListId | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("sos_return") === "1") {
        localStorage.removeItem("sos_return");
        setShowSosToast(true);
      }
    } catch {}
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleGridDragStart = useCallback((event: DragStartEvent) => {
    setActiveGridId(event.active.id as GridId);
  }, []);

  const handleGridDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGridId(null);
    if (over && active.id !== over.id) {
      setGridOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as GridId);
        const newIndex = prev.indexOf(over.id as GridId);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveGridOrder(next);
        return next;
      });
    }
  }, []);

  const handleListDragStart = useCallback((event: DragStartEvent) => {
    setActiveListId(event.active.id as ListId);
  }, []);

  const handleListDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveListId(null);
    if (over && active.id !== over.id) {
      setListOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as ListId);
        const newIndex = prev.indexOf(over.id as ListId);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveListOrder(next);
        return next;
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasCovenant = progress?.covenantSigned;
  const dayOneDone = progress?.firstDayTasksCompleted;

  return (
    <div className="flex flex-col flex-1 pb-8">
      <AnimatePresence>
        {showSosToast && <SosReturnToast onDismiss={() => setShowSosToast(false)} />}
      </AnimatePresence>

      {/* Hero + bell overlay */}
      <div className="relative">
        <IslamicHero />
        <HeroBellButton />
      </div>

      <div className="px-5 mt-4 relative z-10 flex flex-col gap-4">

        <EidEntryCard />
        <DynamicBanner />

        {/* Main journey card — fixed, not sortable */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-xl shadow-black/5 border border-border"
        >
          {!hasCovenant ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary"><Heart size={32} /></div>
              <h2 className="text-xl font-bold mb-2">رحلة العودة إلى الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">التوبة هي بداية جديدة، صفحة بيضاء بينك وبين ربك. هل أنت مستعد لاتخاذ القرار؟</p>
              <Link href="/covenant" className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
                <span>ابدأ رحلة التوبة الآن</span><ArrowLeft size={18} />
              </Link>
            </div>
          ) : !dayOneDone ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-4"><Activity size={32} /></div>
              <h2 className="text-xl font-bold mb-2">لقد عاهدت الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">بقيت خطوات بسيطة لتأكيد صدق نيتك وبدء صفحة جديدة تماماً.</p>
              <Link href="/day-one" className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
                <span>أكمل مهام اللحظة الأولى</span><CheckCircle2 size={18} />
              </Link>
            </div>
          ) : (
            <Journey30HeroCard />
          )}
        </motion.div>

        {/* Edit mode banner */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3"
            >
              <div>
                <p className="text-xs font-bold text-primary">وضع الترتيب مفعّل</p>
                <p className="text-[10px] text-primary/60 mt-0.5">اسحب أي بطاقة من مقبضها لإعادة ترتيبها</p>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="text-xs font-bold text-primary bg-primary/15 hover:bg-primary/25 px-4 py-1.5 rounded-xl transition-colors"
              >
                تم ✓
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid section (square cards) ─────────────────────────── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleGridDragStart}
          onDragEnd={handleGridDragEnd}
        >
          <SortableContext items={gridOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3">
              {gridOrder.map((id) => (
                <SortableGridItem key={id} id={id} editMode={editMode} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
            {activeGridId ? (
              <div className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-sm rotate-2 scale-[1.05] flex flex-col items-center justify-center gap-2 p-4 aspect-square w-full">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${GRID_META[activeGridId].iconBg}`}>
                  {GRID_META[activeGridId].icon}
                </div>
                <p className="text-xs font-bold text-primary">{GRID_META[activeGridId].label}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── List section (full-width cards) ─────────────────────── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleListDragStart}
          onDragEnd={handleListDragEnd}
        >
          <SortableContext items={listOrder} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {listOrder.map((id) => (
                <SortableListItem key={id} id={id} editMode={editMode}>
                  {renderSection(id)}
                </SortableListItem>
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeListId ? (
              <div className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/98 backdrop-blur-sm overflow-hidden rotate-1 scale-[1.03]">
                <div className="px-4 py-3 flex items-center gap-3 bg-primary/5">
                  <GripVertical size={16} className="text-primary" />
                  <span className="text-sm font-bold text-primary">{SECTION_LABELS[activeListId]}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Organize toggle button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={() => setEditMode((v) => !v)}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border text-sm font-bold transition-all ${
            editMode
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
          }`}
        >
          <Settings2 size={16} />
          {editMode ? "إنهاء التنظيم" : "إعادة ترتيب البطاقات"}
        </motion.button>

      </div>
    </div>
  );
}
