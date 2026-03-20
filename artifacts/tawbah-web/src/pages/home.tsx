import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Heart, Activity, CircleDot, HeartHandshake, BookOpen, PenLine, ScrollText, Clock, BarChart2, Sparkles, ListChecks, ImageIcon, Swords, Globe, Users, CalendarDays, Bell, HandHeart, Moon, Sun, Star, BookMarked, MessageCircle, Volume2, X, BookText, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { LiveStats } from "@/components/live-stats";
import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/context/SettingsContext";

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
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 3 && day >= 15 && day <= 31)
    return { type: "season", label: "آخر رمضان قادم", content: "استعد لليالي المباركة — العشر الأواخر فرصة لا تتكرر. حسّن توبتك الآن.", icon: "moon", seasonColor: "from-emerald-600/25 to-teal-400/5 border-emerald-500/25" };
  if (month === 4 && day <= 3)
    return { type: "season", label: "ليالي العيد", content: "من أحيا ليالي العيد بالذكر والطاعة لم يمُت قلبه يوم تموت القلوب.", icon: "star", seasonColor: "from-amber-500/25 to-yellow-300/5 border-amber-400/25" };
  if (month === 6 && day >= 1 && day <= 10)
    return { type: "season", label: "العشر من ذي الحجة", content: "أفضل أيام السنة — صيام وذكر وتوبة. أعمالك الصالحة مضاعفة.", icon: "sparkles", seasonColor: "from-amber-600/25 to-yellow-400/5 border-amber-500/25" };
  if (month === 7 && day === 9)
    return { type: "season", label: "يوم عرفة 🤲", content: "أكثر يوم يُعتَق فيه الناس من النار — اجتهد في الدعاء والاستغفار الآن.", icon: "star", seasonColor: "from-primary/25 to-primary/5 border-primary/20" };
  if (month === 8 && day >= 1 && day <= 15)
    return { type: "season", label: "شعبان — شهر رفع الأعمال", content: "أعمالك تُرفَع إلى الله قبل رمضان. ابدأ الاستعداد من الآن بصفحة نظيفة.", icon: "moon", seasonColor: "from-purple-600/25 to-violet-400/5 border-purple-400/25" };
  if (month === 1 || month === 2)
    return { type: "season", label: "الأشهر الحرم", content: "ذو القعدة وذو الحجة والمحرم ورجب — أشهر عظّمها الله. الحسنات مضاعفة والسيئات مثقّلة.", icon: "sparkles", seasonColor: "from-sky-600/25 to-blue-400/5 border-sky-400/25" };

  const dayOfWeek = now.getDay();
  if (dayOfWeek === 5)
    return { type: "season", label: "يوم الجمعة المبارك", content: "أكثر من الصلاة على النبي ﷺ اليوم — اقرأ سورة الكهف وادعُ في ساعة الإجابة.", icon: "sun", seasonColor: "from-green-600/25 to-emerald-400/5 border-green-400/25" };

  return null;
}

const ICON_MAP = {
  sparkles: Sparkles,
  moon: Moon,
  sun: Sun,
  star: Star,
  book: BookMarked,
  chat: MessageCircle,
};

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
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
          </div>

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3 bg-gradient-to-r ${styles.gradient} border-b ${styles.border}`}>
            <div className="flex items-center gap-2">
              <BookText size={16} className={styles.iconColor} />
              <span className={`font-bold text-sm ${styles.iconColor}`}>التفسير الميسر</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-background/60 hover:bg-background/90 transition-colors"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Ayah text */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground leading-loose text-center font-arabic mb-3">
              {item.content}
            </p>
            <div className="h-px bg-border/60 my-3" />
            <p className="text-sm text-foreground/80 leading-relaxed text-right" dir="rtl">
              {item.tafsir}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold ${styles.iconColor} bg-gradient-to-r ${styles.gradient} border ${styles.border}`}
            >
              حفظ الله قلبك
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
    const interval = setInterval(() => {
      setPoolIndex(getPoolIndex());
      setManualIndex(null);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Stop audio when banner changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioState("idle");
    setShowTafsir(false);
  }, [poolIndex, manualIndex, showSeason]);

  const currentItem: BannerItem = showSeason && seasonBanner
    ? seasonBanner
    : BANNER_POOL[manualIndex !== null ? manualIndex : poolIndex];

  const IconComp = ICON_MAP[currentItem.icon];

  const handleNext = () => {
    if (showSeason) {
      setShowSeason(false);
      setManualIndex(poolIndex);
    } else {
      const next = ((manualIndex !== null ? manualIndex : poolIndex) + 1) % BANNER_POOL.length;
      setManualIndex(next);
    }
  };

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem.ayahRef) return;

    // If already playing, stop
    if (audioState === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioState("idle");
      return;
    }

    setAudioState("loading");
    try {
      const { surah, ayah } = currentItem.ayahRef;
      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${quranReciterId}`
      );
      const json = await res.json();
      const audioUrl: string = json?.data?.audio;
      if (!audioUrl) throw new Error("No audio URL");

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      setAudioState("playing");
      audio.onended = () => setAudioState("idle");
      audio.onerror = () => setAudioState("idle");
    } catch {
      setAudioState("idle");
    }
  };

  const styles = TYPE_STYLES[currentItem.type];
  const gradientClass = currentItem.type === "season" && currentItem.seasonColor
    ? currentItem.seasonColor
    : `${styles.gradient} ${styles.border}`;

  const isAyah = currentItem.type === "ayah" && !!currentItem.ayahRef;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.label + currentItem.content.slice(0, 20)}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
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

          {/* Ayah action buttons */}
          {isAyah && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-current/10" onClick={(e) => e.stopPropagation()}>
              {/* Listen button */}
              <button
                onClick={handleListen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all
                  ${audioState === "playing"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-background/70 hover:bg-background text-foreground/80 border border-current/10"
                  }`}
              >
                {audioState === "loading" ? (
                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
                ) : (
                  <Volume2 size={12} className={audioState === "playing" ? "animate-pulse" : ""} />
                )}
                {audioState === "playing" ? "إيقاف" : "استمع"}
              </button>

              {/* Tafsir button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowTafsir(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-background/70 hover:bg-background text-foreground/80 border border-current/10 transition-all"
              >
                <BookText size={12} />
                تفسير ميسر
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tafsir floating sheet */}
      {showTafsir && currentItem.tafsir && (
        <TafsirSheet item={currentItem} onClose={() => setShowTafsir(false)} />
      )}
    </>
  );
}

function InviteFriendCard() {
  const [shared, setShared] = useState(false);

  const handleInvite = async () => {
    const text = "اكتشفت تطبيقاً يساعدك على التوبة الصادقة 🌿\nرحلة 40 يوماً مع خطة يومية وذكر وإرشاد روحي.\n\nابدأ رحلتك الآن 👇";
    const url = window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: "دليل التوبة النصوح", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  return (
    <button
      onClick={handleInvite}
      className="w-full flex items-center gap-4 bg-gradient-to-l from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all text-right"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
        <HeartHandshake size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">ادعُ رفيقاً في رحلة التوبة</h3>
        <p className="text-[11px] text-muted-foreground">شارك التطبيق — الدال على الخير كفاعله</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {shared
          ? <span className="text-xs font-bold text-primary">تم! ✓</span>
          : <Share2 size={16} className="text-primary" />
        }
      </div>
    </button>
  );
}

function getTimeGreeting(): { greeting: string; sub: string } {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return { greeting: "صباح النور يا تائب 🌅", sub: "ابدأ يومك بذكر الله" };
  if (hour >= 12 && hour < 16) return { greeting: "طاب ظهرك بطاعة الله ☀️", sub: "استمر — الله يراك ويُحبّ مداومتك" };
  if (hour >= 16 && hour < 20) return { greeting: "مساء الخير والإيمان 🌇", sub: "لا تنسَ سيد الاستغفار مساءً" };
  return { greeting: "الله يثبّتك في ليلتك 🌙", sub: "هذا وقت الوتر وسيد الاستغفار" };
}

function SosReturnToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto"
    >
      <div
        className="bg-emerald-600 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3"
        onClick={onDismiss}
      >
        <span className="text-xl shrink-0">🌿</span>
        <div className="flex-1">
          <p className="font-bold text-sm">أحسنت — الله يثبّتك</p>
          <p className="text-emerald-100 text-xs">قاومت ونجحت. استمر في رحلتك.</p>
        </div>
        <button onClick={onDismiss} className="text-white/70 hover:text-white text-lg leading-none">×</button>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { data: progress, isLoading } = useAppUserProgress();
  const [showSosToast, setShowSosToast] = useState(false);
  const timeGreeting = getTimeGreeting();

  useEffect(() => {
    try {
      if (localStorage.getItem("sos_return") === "1") {
        localStorage.removeItem("sos_return");
        setShowSosToast(true);
      }
    } catch {}
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

      <div className="relative h-[200px] w-full overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Islamic Pattern"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/50 to-primary/20 mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground p-6 text-center" style={{ paddingBottom: "2.5rem" }}>
          <p className="text-base font-bold text-white drop-shadow-lg mb-1">{timeGreeting.greeting}</p>
          <p className="text-xs font-medium text-white/80 max-w-[260px] leading-relaxed drop-shadow">
            {timeGreeting.sub}
          </p>
        </div>
      </div>

      <div className="flex justify-center -mt-9 relative z-20 mb-1">
        <img
          src={`${import.meta.env.BASE_URL}images/logo.png`}
          alt="توبة نصوحة"
          className="h-[72px] w-[72px] object-cover rounded-full drop-shadow-2xl ring-4 ring-background"
        />
      </div>

      <div className="px-5 mt-3 relative z-10 flex flex-col gap-4">

        <DynamicBanner />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-xl shadow-black/5 border border-border"
        >
          {!hasCovenant ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Heart size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">رحلة العودة إلى الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                التوبة هي بداية جديدة، صفحة بيضاء بينك وبين ربك. هل أنت مستعد لاتخاذ القرار؟
              </p>
              <Link
                href="/covenant"
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>ابدأ رحلة التوبة الآن</span>
                <ArrowLeft size={18} />
              </Link>
            </div>
          ) : !dayOneDone ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-4">
                <Activity size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">لقد عاهدت الله</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                بقيت خطوات بسيطة لتأكيد صدق نيتك وبدء صفحة جديدة تماماً.
              </p>
              <Link
                href="/day-one"
                className="w-full py-3.5 bg-accent text-accent-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>أكمل مهام اللحظة الأولى</span>
                <CheckCircle2 size={18} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">خطة الـ 40 يوماً</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    أنت في اليوم <span className="text-primary font-bold">{progress.day40Progress || 1}</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="text-xl font-bold">{progress.streakDays || 0}</span>
                  <span className="text-[10px] ml-0.5">يوم</span>
                </div>
              </div>
              <Link
                href="/plan"
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>متابعة مهام اليوم</span>
                <ArrowLeft size={18} />
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            href="/card"
            className="flex items-center gap-4 bg-gradient-to-l from-amber-500/10 to-primary/10 border border-amber-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
              <ImageIcon size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">بطاقة توبتي</h3>
              <p className="text-[11px] text-muted-foreground">اصنع بطاقة جميلة وشاركها مع الناس</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.175 }}
        >
          <Link
            href="/challenge/create"
            className="flex items-center gap-4 bg-gradient-to-l from-emerald-500/10 to-primary/10 border border-emerald-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shrink-0">
              <Swords size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">تحدي التوبة</h3>
              <p className="text-[11px] text-muted-foreground">ابدأ تحدياً وشارك رابطه — ليدعو لك الناس</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <Link
            href="/map"
            className="flex items-center gap-4 bg-gradient-to-l from-blue-500/10 to-primary/10 border border-blue-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0">
              <Globe size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">خريطة التوبة العالمية</h3>
              <p className="text-[11px] text-muted-foreground">من أي دول يتوب المسلمون الآن؟</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.19 }}
        >
          <Link
            href="/journey"
            className="flex items-center gap-4 bg-gradient-to-l from-violet-500/10 to-primary/10 border border-violet-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shrink-0">
              <CalendarDays size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">رحلة ٣٠ يوماً</h3>
              <p className="text-[11px] text-muted-foreground">برنامج تدريجي يومي للتوبة والاستقامة</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.195 }}
        >
          <Link
            href="/dhikr-rooms"
            className="flex items-center gap-4 bg-gradient-to-l from-teal-500/10 to-primary/10 border border-teal-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">غرف الذكر الجماعي</h3>
              <p className="text-[11px] text-muted-foreground">سبّح مع آلاف المسلمين الآن</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.197 }}
        >
          <Link
            href="/ameen"
            className="flex items-center gap-4 bg-gradient-to-l from-rose-500/10 to-pink-500/5 border border-rose-400/25 rounded-2xl p-4 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-md shrink-0">
              <HandHeart size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">قل آمين 🤲</h3>
              <p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول — وقل آمين لدعائه</p>
            </div>
            <ArrowLeft size={16} className="text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.183 }}
        >
          <InviteFriendCard />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.185 }}
        >
          <LiveStats />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-bold text-muted-foreground mb-3 px-1">الأدوات الروحية</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/kaffarah" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <ScrollText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">الكفارات الشرعية</h3>
                <p className="text-[11px] text-muted-foreground">خطوات مفصّلة لكل ذنب</p>
              </div>
            </Link>
            <Link href="/rajaa" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مكتبة الرجاء</h3>
                <p className="text-[11px] text-muted-foreground">آيات وأحاديث وقصص</p>
              </div>
            </Link>
            <Link href="/dhikr" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <CircleDot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مسبحة الذكر</h3>
                <p className="text-[11px] text-muted-foreground">استغفار وتسبيح</p>
              </div>
            </Link>
            <Link href="/signs" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">تباشير القبول</h3>
                <p className="text-[11px] text-muted-foreground">علامات قبول التوبة</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-bold text-muted-foreground mb-3 px-1">أدوات شخصية</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/journal" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <PenLine size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">يوميات التوبة</h3>
                <p className="text-[11px] text-muted-foreground">مساحة سرية خاصة بك</p>
              </div>
            </Link>
            <Link href="/progress" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">خريطة التقدم</h3>
                <p className="text-[11px] text-muted-foreground">إحصاءاتك الروحية</p>
              </div>
            </Link>
            <Link href="/danger-times" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">أوقات الخطر</h3>
                <p className="text-[11px] text-muted-foreground">تذكيرات وقائية ذكية</p>
              </div>
            </Link>
            <Link href="/relapse" className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">ضعفت وعدت؟</h3>
                <p className="text-[11px] text-muted-foreground">اقرأ هذا فوراً</p>
              </div>
            </Link>
            <Link href="/hadi-tasks" className="bg-card p-4 rounded-2xl border border-emerald-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5 col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">مهام هادي</h3>
                  <p className="text-[11px] text-muted-foreground">نصائح الزكي تتحول لمهام تتابعها خطوة بخطوة</p>
                </div>
              </div>
            </Link>
            <Link href="/secret-dua" className="bg-card p-4 rounded-2xl border border-rose-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">الصديق السري</h3>
                <p className="text-[11px] text-muted-foreground">ادعُ لأخٍ مجهول بلا أسماء</p>
              </div>
            </Link>
            <Link href="/prayer-times" className="bg-card p-4 rounded-2xl border border-indigo-300/40 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">مواقيت الصلاة</h3>
                <p className="text-[11px] text-muted-foreground">تذكيرات ذكية قبل كل صلاة</p>
              </div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
