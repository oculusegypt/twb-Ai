import { useLocation } from "wouter";
import { ArrowRight, Play, Star, Radio, Tv, BookOpen, Scale, Scroll, Mic2, ChevronLeft, Flame } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

type Program = {
  id: string;
  name: string;
  host?: string;
  category: CategoryId;
  featured?: boolean;
  hot?: boolean;
  badge?: string;
  color: string; // gradient from
  colorTo: string; // gradient to
  icon: string; // emoji icon
};

type CategoryId =
  | "quran"
  | "dawah"
  | "fatwa"
  | "stories"
  | "radio";

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "quran",   label: "تفسير القرآن",       icon: <BookOpen size={16} />, color: "#10b981" },
  { id: "dawah",   label: "دعوية وإيمانية",      icon: <Mic2 size={16} />,    color: "#8b5cf6" },
  { id: "fatwa",   label: "فتاوى وأحكام",        icon: <Scale size={16} />,   color: "#f59e0b" },
  { id: "stories", label: "قصص وسيرة",           icon: <Scroll size={16} />,  color: "#ef4444" },
  { id: "radio",   label: "إذاعية",              icon: <Radio size={16} />,   color: "#3b82f6" },
];

const PROGRAMS: Program[] = [
  // تفسير القرآن
  { id: "p1",  name: "لعلهم يفقهون",         host: "د. عمر عبد الكافي", category: "quran",  featured: true, hot: true, badge: "الأشهر",  color: "#064e3b", colorTo: "#065f46", icon: "📖" },
  { id: "p2",  name: "في رحاب سورة",          host: "د. راغب السرجاني",  category: "quran",  featured: true,                              color: "#065f46", colorTo: "#047857", icon: "🌿" },
  { id: "p3",  name: "خواطر",                 host: "أحمد الشقيري",      category: "quran",  featured: true, hot: true, badge: "تريند",   color: "#1e3a5f", colorTo: "#1e40af", icon: "✨" },
  { id: "p4",  name: "تفسير الشعراوي",        host: "الشيخ الشعراوي",    category: "quran",  featured: true,            badge: "أيقونة",  color: "#3b0764", colorTo: "#6d28d9", icon: "📜" },
  { id: "p5",  name: "نور على نور",           category: "quran",                                                                            color: "#166534", colorTo: "#15803d", icon: "💡" },
  { id: "p6",  name: "بينات",                 category: "quran",                                                                            color: "#1e3a5f", colorTo: "#1d4ed8", icon: "🔆" },
  { id: "p7",  name: "القرآن علم وعمل",       category: "quran",                                                                            color: "#422006", colorTo: "#92400e", icon: "🧠" },
  { id: "p8",  name: "مع القرآن",             category: "quran",                                                                            color: "#14532d", colorTo: "#166534", icon: "🌙" },
  { id: "p9",  name: "آيات بينات",            category: "quran",                                                                            color: "#1c1917", colorTo: "#292524", icon: "🌟" },
  { id: "p10", name: "ورتل القرآن ترتيلا",    category: "quran",                                                                            color: "#0c4a6e", colorTo: "#0369a1", icon: "🎵" },

  // دعوية وإيمانية
  { id: "p11", name: "سواعد الإخاء",          host: "نخبة دعاة",          category: "dawah",  featured: true, hot: true, badge: "ملتهب",   color: "#7c2d12", colorTo: "#b45309", icon: "🤝" },
  { id: "p12", name: "الحصن",                 category: "dawah",                                                                            color: "#1e3a8a", colorTo: "#1d4ed8", icon: "🏰" },
  { id: "p13", name: "قلوب عامرة",            category: "dawah",                                                                            color: "#4a1942", colorTo: "#7c3aed", icon: "❤️" },
  { id: "p14", name: "يحب الجمال",            category: "dawah",                                                                            color: "#0f172a", colorTo: "#1e293b", icon: "🌸" },
  { id: "p15", name: "الإمام الطيب",          host: "شيخ الأزهر",         category: "dawah",  featured: true,                              color: "#1c3326", colorTo: "#15803d", icon: "👳" },
  { id: "p16", name: "مصر أرض المجددين",      category: "dawah",                                                                            color: "#1e3a5f", colorTo: "#1e40af", icon: "🇪🇬" },
  { id: "p17", name: "البناء الإيماني",       category: "dawah",                                                                            color: "#422006", colorTo: "#d97706", icon: "🏗️" },
  { id: "p18", name: "الطريق إلى الله",       category: "dawah",                                                                            color: "#0c0a09", colorTo: "#1c1917", icon: "🌄" },
  { id: "p19", name: "كنوز السنة",            category: "dawah",                                                                            color: "#3b0764", colorTo: "#7c3aed", icon: "💎" },
  { id: "p20", name: "رسالة إلى الله",        category: "dawah",                                                                            color: "#0c4a6e", colorTo: "#0284c7", icon: "📩" },

  // فتاوى وأحكام
  { id: "p21", name: "اسأل مع دعاء",          category: "fatwa", featured: true,                                                            color: "#422006", colorTo: "#b45309", icon: "❓" },
  { id: "p22", name: "فتاوى على الهواء",       category: "fatwa",                                                                            color: "#1a1a2e", colorTo: "#16213e", icon: "📡" },
  { id: "p23", name: "الجواب الكافي",          category: "fatwa",                                                                            color: "#14532d", colorTo: "#15803d", icon: "✅" },
  { id: "p24", name: "الدين والحياة",          category: "fatwa",                                                                            color: "#1e3a8a", colorTo: "#2563eb", icon: "⚖️" },
  { id: "p25", name: "فاسألوا أهل الذكر",     category: "fatwa",                                                                            color: "#3b0764", colorTo: "#6d28d9", icon: "🧑‍🏫" },
  { id: "p26", name: "بين السائل والفقيه",     category: "fatwa",                                                                            color: "#0c4a6e", colorTo: "#0369a1", icon: "🗣️" },
  { id: "p27", name: "مع الناس",               category: "fatwa",                                                                            color: "#166534", colorTo: "#16a34a", icon: "👥" },
  { id: "p28", name: "فتاوى رمضان",            category: "fatwa",                                                                            color: "#78350f", colorTo: "#d97706", icon: "🌙" },
  { id: "p29", name: "نور الفتاوى",            category: "fatwa",                                                                            color: "#0c0a09", colorTo: "#44403c", icon: "🕯️" },
  { id: "p30", name: "الشريعة والحياة",        category: "fatwa",                                                                            color: "#1e3a5f", colorTo: "#1e40af", icon: "📋" },

  // قصص وسيرة
  { id: "p31", name: "قصص الأنبياء",           category: "stories", featured: true, hot: true, badge: "خالد",                              color: "#064e3b", colorTo: "#065f46", icon: "📚" },
  { id: "p32", name: "السيرة النبوية",          category: "stories", featured: true,            badge: "مميز",                              color: "#1c1917", colorTo: "#44403c", icon: "🌹" },
  { id: "p33", name: "رجال حول الرسول",        category: "stories",                                                                          color: "#422006", colorTo: "#b45309", icon: "⚔️" },
  { id: "p34", name: "عمر (وثائقي درامي)",     category: "stories", featured: true, hot: true, badge: "ملحمي",                              color: "#1a1a2e", colorTo: "#16213e", icon: "🎬" },
  { id: "p35", name: "حياة الصحابة",           category: "stories",                                                                          color: "#14532d", colorTo: "#166534", icon: "🌟" },
  { id: "p36", name: "قصص القرآن",             category: "stories",                                                                          color: "#0c4a6e", colorTo: "#0369a1", icon: "📖" },
  { id: "p37", name: "ثم اهتديت",              category: "stories",                                                                          color: "#3b0764", colorTo: "#7c3aed", icon: "🕊️" },
  { id: "p38", name: "أعلام الإسلام",          category: "stories",                                                                          color: "#1e3a8a", colorTo: "#1d4ed8", icon: "🏆" },
  { id: "p39", name: "مساجد من التاريخ",       category: "stories",                                                                          color: "#166534", colorTo: "#15803d", icon: "🕌" },
  { id: "p40", name: "مساجد الشرقية",          category: "stories",                                                                          color: "#422006", colorTo: "#92400e", icon: "🏛️" },

  // إذاعية
  { id: "p41", name: "نور على الدرب",          host: "ابن باز & ابن عثيمين", category: "radio", featured: true, hot: true, badge: "أسطوري", color: "#0c4a6e", colorTo: "#0369a1", icon: "📻" },
  { id: "p42", name: "حديث الصباح",            category: "radio",                                                                            color: "#78350f", colorTo: "#f59e0b", icon: "🌅" },
  { id: "p43", name: "قطوف إيمانية",           category: "radio",                                                                            color: "#14532d", colorTo: "#16a34a", icon: "🌾" },
  { id: "p44", name: "خواطر إسلامية",          category: "radio",                                                                            color: "#1e3a5f", colorTo: "#1e40af", icon: "💭" },
  { id: "p45", name: "دين ودنيا",              category: "radio",                                                                            color: "#1c1917", colorTo: "#292524", icon: "🌍" },
  { id: "p46", name: "رسالة الإسلام",          category: "radio",                                                                            color: "#064e3b", colorTo: "#065f46", icon: "📨" },
  { id: "p47", name: "التلاوة والتفسير",       category: "radio",                                                                            color: "#422006", colorTo: "#b45309", icon: "🎙️" },
  { id: "p48", name: "فقه الحياة",             category: "radio",                                                                            color: "#3b0764", colorTo: "#6d28d9", icon: "🔬" },
  { id: "p49", name: "مع القرآن الكريم",       category: "radio",                                                                            color: "#166534", colorTo: "#15803d", icon: "📿" },
  { id: "p50", name: "دقائق إيمانية",          category: "radio",                                                                            color: "#0c0a09", colorTo: "#1c1917", icon: "⏱️" },
];

const FEATURED = PROGRAMS.filter((p) => p.featured);

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroBanner({ program }: { program: Program }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden flex flex-col justify-end"
      style={{
        height: 180,
        background: `linear-gradient(135deg, ${program.color}, ${program.colorTo})`,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-[-30px] right-[-30px] w-[140px] h-[140px] rounded-full opacity-10 bg-white" />
      <div className="absolute bottom-[-40px] left-[-20px] w-[120px] h-[120px] rounded-full opacity-10 bg-white" />

      {/* Icon large */}
      <div className="absolute top-4 right-5 text-[52px] opacity-30 select-none">{program.icon}</div>

      {/* Content */}
      <div className="relative z-10 p-5">
        {program.badge && (
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
            style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            {program.badge}
          </span>
        )}
        <h3 className="text-white font-bold text-xl leading-tight">{program.name}</h3>
        {program.host && (
          <p className="text-white/70 text-[12px] mt-0.5">{program.host}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            <Play size={11} fill="white" />
            <span>ابحث عنه</span>
          </button>
          {program.hot && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#fbbf24" }}>
              <Flame size={12} fill="#fbbf24" /> رائج
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden shrink-0 flex flex-col justify-end"
      style={{
        width: 130,
        height: 90,
        background: `linear-gradient(135deg, ${program.color}, ${program.colorTo})`,
      }}
    >
      {/* Decorative */}
      <div className="absolute top-[-15px] right-[-15px] w-[60px] h-[60px] rounded-full opacity-15 bg-white" />

      {/* Icon */}
      <div className="absolute top-2 right-2 text-[24px] opacity-40 select-none">{program.icon}</div>

      {/* Badge */}
      {program.badge && (
        <div
          className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.9)", color: "#1c0f00" }}
        >
          {program.badge}
        </div>
      )}

      {/* Name */}
      <div className="relative z-10 p-2.5">
        <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">{program.name}</p>
        {program.host && (
          <p className="text-white/60 text-[9px] mt-0.5 truncate">{program.host}</p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ catId }: { catId: CategoryId }) {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const programs = PROGRAMS.filter((p) => p.category === catId);
  return (
    <div className="mb-6">
      {/* Row header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span style={{ color: cat.color }}>{cat.icon}</span>
        <h3 className="font-bold text-[15px]">{cat.label}</h3>
        <span className="text-[11px] text-muted-foreground mr-auto">{programs.length} برنامج</span>
        <ChevronLeft size={14} className="text-muted-foreground" />
      </div>
      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ direction: "rtl" }}>
        {programs.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <ProgramCard program={p} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IslamicPrograms() {
  const [, navigate] = useLocation();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const [activeCategory, setActiveCategory] = React.useState<CategoryId | "all">("all");
  const [featuredIndex, setFeaturedIndex] = React.useState(0);

  // Auto-rotate hero
  React.useEffect(() => {
    const t = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % FEATURED.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const visibleCategories = activeCategory === "all"
    ? CATEGORIES.map((c) => c.id)
    : [activeCategory];

  return (
    <div
      className="min-h-screen pb-28"
      style={{ direction: "rtl" }}
    >
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
        >
          <ArrowRight size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Tv size={18} className="text-primary" />
          <h1 className="font-bold text-[17px]">برامج إسلامية</h1>
        </div>
        <span
          className="mr-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}
        >
          {PROGRAMS.length} برنامج
        </span>
      </div>

      <div className="px-4 pt-5">
        {/* ── Hero carousel ── */}
        <div className="mb-5">
          <motion.div
            key={featuredIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <HeroBanner program={FEATURED[featuredIndex]} />
          </motion.div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {FEATURED.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeaturedIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === featuredIndex ? 20 : 6,
                  height: 6,
                  background: i === featuredIndex ? "#8b5cf6" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"),
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Category filter chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide" style={{ direction: "rtl" }}>
          <button
            onClick={() => setActiveCategory("all")}
            className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
            style={{
              background: activeCategory === "all" ? "#8b5cf6" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
              color: activeCategory === "all" ? "#fff" : undefined,
            }}
          >
            الكل
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{
                background: activeCategory === cat.id ? cat.color : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                color: activeCategory === cat.id ? "#fff" : undefined,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* ── Stats bar ── */}
        {activeCategory === "all" && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl p-2.5"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  minWidth: 72,
                }}
              >
                <span style={{ color: cat.color }}>{cat.icon}</span>
                <span className="text-[14px] font-bold">{PROGRAMS.filter((p) => p.category === cat.id).length}</span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{cat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Program rows ── */}
        {visibleCategories.map((catId) => (
          <CategoryRow key={catId} catId={catId} />
        ))}
      </div>
    </div>
  );
}

// Need React for useEffect and useState
import React from "react";
