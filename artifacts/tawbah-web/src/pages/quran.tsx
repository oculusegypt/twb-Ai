import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, ChevronDown, ChevronUp,
  Star, Sparkles, Zap, BookMarked, Brain,
  Check, Bookmark, Share2,
  Sun, Flame, Award
} from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Surah {
  id: number;
  name: string;
  nameEn: string;
  revelation: "مكية" | "مدنية";
  ayahCount: number;
  juz: number;
  meaning: string;
}

interface QuranMiracle {
  id: number;
  title: string;
  icon: string;
  category: "عددي" | "علمي" | "لغوي" | "تاريخي";
  description: string;
  detail: string;
  color: string;
}

interface QuranScience {
  id: number;
  title: string;
  icon: string;
  description: string;
  gradient: string;
  border: string;
  route: string;
}

interface DailyAyah {
  arabic: string;
  surah: string;
  ayahNum: number;
  tafsir: string;
  memorize: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SURAHS: Surah[] = [
  { id: 1,  name: "الفاتحة",      nameEn: "Al-Fatiha",     revelation: "مكية",  ayahCount: 7,   juz: 1,  meaning: "الفاتحة" },
  { id: 2,  name: "البقرة",       nameEn: "Al-Baqara",     revelation: "مدنية", ayahCount: 286, juz: 1,  meaning: "البقرة" },
  { id: 3,  name: "آل عمران",     nameEn: "Aal Imran",     revelation: "مدنية", ayahCount: 200, juz: 3,  meaning: "آل عمران" },
  { id: 4,  name: "النساء",       nameEn: "An-Nisa",       revelation: "مدنية", ayahCount: 176, juz: 4,  meaning: "النساء" },
  { id: 5,  name: "المائدة",      nameEn: "Al-Maida",      revelation: "مدنية", ayahCount: 120, juz: 6,  meaning: "المائدة" },
  { id: 6,  name: "الأنعام",      nameEn: "Al-Anam",       revelation: "مكية",  ayahCount: 165, juz: 7,  meaning: "الأنعام" },
  { id: 7,  name: "الأعراف",      nameEn: "Al-Araf",       revelation: "مكية",  ayahCount: 206, juz: 8,  meaning: "الأعراف" },
  { id: 8,  name: "الأنفال",      nameEn: "Al-Anfal",      revelation: "مدنية", ayahCount: 75,  juz: 9,  meaning: "الأنفال" },
  { id: 9,  name: "التوبة",       nameEn: "At-Tawba",      revelation: "مدنية", ayahCount: 129, juz: 10, meaning: "التوبة" },
  { id: 10, name: "يونس",         nameEn: "Yunus",          revelation: "مكية",  ayahCount: 109, juz: 11, meaning: "نبي الله يونس" },
  { id: 11, name: "هود",          nameEn: "Hud",            revelation: "مكية",  ayahCount: 123, juz: 11, meaning: "نبي الله هود" },
  { id: 12, name: "يوسف",         nameEn: "Yusuf",          revelation: "مكية",  ayahCount: 111, juz: 12, meaning: "نبي الله يوسف" },
  { id: 13, name: "الرعد",        nameEn: "Ar-Rad",         revelation: "مدنية", ayahCount: 43,  juz: 13, meaning: "الرعد" },
  { id: 14, name: "إبراهيم",      nameEn: "Ibrahim",        revelation: "مكية",  ayahCount: 52,  juz: 13, meaning: "نبي الله إبراهيم" },
  { id: 15, name: "الحجر",        nameEn: "Al-Hijr",        revelation: "مكية",  ayahCount: 99,  juz: 14, meaning: "الحجر" },
  { id: 16, name: "النحل",        nameEn: "An-Nahl",        revelation: "مكية",  ayahCount: 128, juz: 14, meaning: "النحل" },
  { id: 17, name: "الإسراء",      nameEn: "Al-Isra",        revelation: "مكية",  ayahCount: 111, juz: 15, meaning: "الإسراء" },
  { id: 18, name: "الكهف",        nameEn: "Al-Kahf",        revelation: "مكية",  ayahCount: 110, juz: 15, meaning: "الكهف" },
  { id: 19, name: "مريم",         nameEn: "Maryam",         revelation: "مكية",  ayahCount: 98,  juz: 16, meaning: "مريم" },
  { id: 20, name: "طه",           nameEn: "Ta-Ha",          revelation: "مكية",  ayahCount: 135, juz: 16, meaning: "طه" },
  { id: 36, name: "يس",           nameEn: "Ya-Sin",         revelation: "مكية",  ayahCount: 83,  juz: 22, meaning: "قلب القرآن" },
  { id: 55, name: "الرحمن",       nameEn: "Ar-Rahman",      revelation: "مدنية", ayahCount: 78,  juz: 27, meaning: "عروس القرآن" },
  { id: 56, name: "الواقعة",      nameEn: "Al-Waqia",       revelation: "مكية",  ayahCount: 96,  juz: 27, meaning: "الواقعة" },
  { id: 67, name: "الملك",        nameEn: "Al-Mulk",        revelation: "مكية",  ayahCount: 30,  juz: 29, meaning: "المانعة" },
  { id: 78, name: "النبأ",        nameEn: "An-Naba",        revelation: "مكية",  ayahCount: 40,  juz: 30, meaning: "النبأ العظيم" },
  { id: 112, name: "الإخلاص",     nameEn: "Al-Ikhlas",      revelation: "مكية",  ayahCount: 4,   juz: 30, meaning: "ثلث القرآن" },
  { id: 113, name: "الفلق",       nameEn: "Al-Falaq",       revelation: "مكية",  ayahCount: 5,   juz: 30, meaning: "المعوذتان" },
  { id: 114, name: "الناس",       nameEn: "An-Nas",         revelation: "مكية",  ayahCount: 6,   juz: 30, meaning: "المعوذتان" },
];

const DAILY_AYAHS: DailyAyah[] = [
  {
    arabic: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    surah: "الإسراء",
    ayahNum: 9,
    tafsir: "إن القرآن الكريم يرشد الناس إلى أعدل الطرق وأقومها وأصوبها في الاعتقاد والعمل والسلوك — فهو دستور الحياة الكاملة.",
    memorize: "احفظ هذه الآية اليوم وكررها ٣ مرات",
  },
  {
    arabic: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ",
    surah: "الإسراء",
    ayahNum: 82,
    tafsir: "القرآن شفاء للقلوب من الشك والنفاق، وشفاء للأجساد بالرقية، ورحمة لمن آمن به وعمل بأحكامه.",
    memorize: "رددها عند قراءة القرآن",
  },
  {
    arabic: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
    surah: "ص",
    ayahNum: 29,
    tafsir: "أنزلنا هذا القرآن المبارك ليتأمل الناس آياته ويفهموا معانيها — والغاية الكبرى من الإنزال هي التدبر لا مجرد التلاوة.",
    memorize: "تأمل آية من القرآن اليوم",
  },
  {
    arabic: "أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ ۚ وَلَوْ كَانَ مِنْ عِندِ غَيْرِ اللَّهِ لَوَجَدُوا فِيهِ اخْتِلَافًا كَثِيرًا",
    surah: "النساء",
    ayahNum: 82,
    tafsir: "ألا يتأملون القرآن تأملاً عميقاً؟ لو كان من عند غير الله لوجدوا فيه تناقضات كثيرة — لكنه كلام الله فهو محكم متسق.",
    memorize: "هذه الآية دليل الإعجاز",
  },
];

const MIRACLES: QuranMiracle[] = [
  {
    id: 1,
    title: "إعجاز عددي مذهل",
    icon: "🔢",
    category: "عددي",
    description: "تكررت كلمة «يوم» في القرآن ٣٦٥ مرة — عدد أيام السنة",
    detail: "وردت «الدنيا» ١١٥ مرة و«الآخرة» ١١٥ مرة. «الملائكة» ٨٨ مرة و«الشياطين» ٨٨ مرة. «الحياة» ١٤٥ مرة و«الموت» ١٤٥ مرة. هذا التوازن الدقيق مستحيل في أي كتاب بشري.",
    color: "from-violet-600/20 to-purple-400/5",
  },
  {
    id: 2,
    title: "إعجاز علمي كوني",
    icon: "🌌",
    category: "علمي",
    description: "وصف القرآن توسع الكون قبل ١٤٠٠ سنة من اكتشافه",
    detail: "﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾ — الذاريات: ٤٧. اكتشف العلماء عام ١٩٢٩ أن الكون يتوسع. القرآن أخبرنا بهذا قبل ١٤ قرناً.",
    color: "from-blue-600/20 to-sky-400/5",
  },
  {
    id: 3,
    title: "إعجاز بيولوجي دقيق",
    icon: "🧬",
    category: "علمي",
    description: "وصف مراحل خلق الجنين بدقة لم يعرفها العلم إلا حديثاً",
    detail: "﴿وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ﴾ — ثم العلقة والمضغة والعظام. قال الدكتور كيث مور: «لم يكن ممكناً وصف هذا بدون مجهر متطور».",
    color: "from-emerald-600/20 to-teal-400/5",
  },
  {
    id: 4,
    title: "إعجاز بحري أسرار",
    icon: "🌊",
    category: "علمي",
    description: "ذكر وجود حواجز بين البحار اكتُشفت حديثاً",
    detail: "﴿مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ * بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ﴾ — الرحمن. اكتشف العلماء وجود حواجز سطحية وعمقية تفصل البحار. الإنسان لم يعرف ذلك إلا بعد اختراع الغواصات.",
    color: "from-cyan-600/20 to-blue-400/5",
  },
  {
    id: 5,
    title: "الإعجاز اللغوي الفريد",
    icon: "📖",
    category: "لغوي",
    description: "تحدى القرآن البشر أن يأتوا بمثله منذ ١٤ قرناً — والتحدي قائم",
    detail: "﴿قُل لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ﴾. بعد ١٤ قرناً من الزمن ولم يستطع أحد — لا شعراء العرب ولا أدباء العالم.",
    color: "from-amber-600/20 to-yellow-400/5",
  },
  {
    id: 6,
    title: "حفظ إلهي ضامن",
    icon: "🛡️",
    category: "تاريخي",
    description: "الوحيد في التاريخ المحفوظ حرفاً بحرف منذ نزوله",
    detail: "﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ — الحجر: ٩. أكثر من مليار مسلم يحفظونه عن ظهر قلب. أي تحريف في أي نسخة يُكتشف فوراً من قِبل الحافظين.",
    color: "from-rose-600/20 to-pink-400/5",
  },
];

const SCIENCES: QuranScience[] = [
  {
    id: 1,
    title: "علم التفسير",
    icon: "📚",
    description: "شرح معاني القرآن وبيان مراد الله من كلامه",
    gradient: "from-emerald-500/15 to-teal-400/5",
    border: "border-emerald-400/30",
    route: "/quran/tafsir",
  },
  {
    id: 2,
    title: "علم التجويد",
    icon: "🎙️",
    description: "إتقان النطق وأحكام تلاوة القرآن الكريم",
    gradient: "from-blue-500/15 to-sky-400/5",
    border: "border-blue-400/30",
    route: "/quran/tajweed",
  },
  {
    id: 3,
    title: "علم أسباب النزول",
    icon: "⚡",
    description: "القصص والأحداث التي نزلت فيها الآيات الكريمة",
    gradient: "from-amber-500/15 to-yellow-400/5",
    border: "border-amber-400/30",
    route: "/quran/asbab",
  },
  {
    id: 4,
    title: "علم الناسخ والمنسوخ",
    icon: "🔄",
    description: "فهم تطور الأحكام الشرعية في القرآن الكريم",
    gradient: "from-violet-500/15 to-purple-400/5",
    border: "border-violet-400/30",
    route: "/quran/naskh",
  },
  {
    id: 5,
    title: "علم القراءات",
    icon: "🌐",
    description: "الروايات والقراءات المتواترة للقرآن الكريم",
    gradient: "from-rose-500/15 to-pink-400/5",
    border: "border-rose-400/30",
    route: "/quran/qiraat",
  },
  {
    id: 6,
    title: "إعجاز القرآن",
    icon: "✨",
    description: "الوجوه الإعجازية العلمية والأدبية والتشريعية",
    gradient: "from-cyan-500/15 to-blue-400/5",
    border: "border-cyan-400/30",
    route: "/quran/ijaz",
  },
];

const VIRTUES = [
  { icon: "👑", text: "خيركم من تعلّم القرآن وعلّمه", source: "البخاري" },
  { icon: "🌟", text: "الماهر بالقرآن مع السفرة الكرام البررة", source: "مسلم" },
  { icon: "💎", text: "اقرأ القرآن فإنه يأتي شفيعاً لأصحابه يوم القيامة", source: "مسلم" },
  { icon: "🔥", text: "من قرأ حرفاً من كتاب الله فله حسنة والحسنة بعشر أمثالها", source: "الترمذي" },
  { icon: "🏠", text: "البيت الذي يُقرأ فيه القرآن يتسع على أهله وتحضره الملائكة", source: "أحمد" },
  { icon: "💫", text: "يُقال لصاحب القرآن اقرأ وارتقِ ورتّل كما كنت ترتّل في الدنيا", source: "أبو داود" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuranHero() {
  const [activeAyahIdx, setActiveAyahIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveAyahIdx(i => (i + 1) % 4), 6000);
    return () => clearInterval(t);
  }, []);

  const ayahs = [
    { text: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ", ref: "الإسراء: ٩" },
    { text: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ", ref: "الإسراء: ٨٢" },
    { text: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ", ref: "ص: ٢٩" },
    { text: "لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا", ref: "الحشر: ٢١" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] mx-0"
      style={{
        background: "linear-gradient(160deg, #040d18 0%, #071428 40%, #030b15 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Particle stars */}
      {[
        [12,8],[88,5],[35,15],[65,7],[90,18],[20,22],[75,12],[50,4],
        [42,20],[80,24],[15,28],[58,10],[30,3],[70,26],[95,8],[5,18],
      ].map(([x, y], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`, top: `${y}%`,
            width: i % 4 === 0 ? 2.5 : 1.5,
            height: i % 4 === 0 ? 2.5 : 1.5,
            background: i % 3 === 0 ? "#c8a84b" : i % 3 === 1 ? "#7dd3fc" : "#ffffff",
          }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 2.5 + (i % 5) * 0.8, repeat: Infinity, delay: (i * 0.35) % 4 }}
        />
      ))}

      {/* Top glow */}
      <div
        className="absolute inset-x-0 top-0 h-[180px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(200,168,75,0.22) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative z-10 px-5 pt-7 pb-6">
        {/* Arabic calligraphy icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(200,168,75,0.25) 0%, rgba(200,168,75,0.08) 100%)",
              border: "1px solid rgba(200,168,75,0.4)",
              boxShadow: "0 0 30px rgba(200,168,75,0.2)",
            }}
          >
            <span style={{ fontSize: 32 }}>📖</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center font-bold leading-tight mb-1"
          style={{
            fontSize: 28,
            background: "linear-gradient(180deg, #ffffff 0%, #c8a84b 60%, #a07c2a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "'Amiri Quran', serif",
          }}
        >
          القرآن الكريم
        </h1>
        <p className="text-center text-[11px] mb-5" style={{ color: "rgba(200,168,75,0.6)" }}>
          مكتبة القرآن الشاملة — تلاوة · تفسير · علوم · إعجاز
        </p>

        {/* Rotating ayah */}
        <div
          className="rounded-2xl px-4 py-4 mb-5"
          style={{
            background: "rgba(200,168,75,0.07)",
            border: "1px solid rgba(200,168,75,0.2)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAyahIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <p
                className="text-center leading-loose mb-2"
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "'Amiri Quran', serif",
                  fontSize: 16,
                }}
              >
                ﴿{ayahs[activeAyahIdx]!.text}﴾
              </p>
              <p className="text-center text-[11px]" style={{ color: "rgba(200,168,75,0.7)" }}>
                — {ayahs[activeAyahIdx]!.ref}
              </p>
            </motion.div>
          </AnimatePresence>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {ayahs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveAyahIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === activeAyahIdx ? 20 : 6,
                  height: 6,
                  background: i === activeAyahIdx ? "#c8a84b" : "rgba(200,168,75,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: "١١٤", label: "سورة" },
            { num: "٦٢٣٦", label: "آية" },
            { num: "٣٠", label: "جزءاً" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-2.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="font-bold"
                style={{ fontSize: 18, color: "#c8a84b", fontFamily: "'Amiri Quran', serif" }}
              >
                {s.num}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Daily Ayah Card ──────────────────────────────────────────────────────────

function DailyAyahCard() {
  const todayIdx = new Date().getDate() % DAILY_AYAHS.length;
  const ayah = DAILY_AYAHS[todayIdx]!;
  const [showTafsir, setShowTafsir] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-[22px] overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.04) 100%)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Sun size={13} className="text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-emerald-600">آية اليوم</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSaved(s => !s)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: saved ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)" }}
          >
            <Bookmark size={13} className={saved ? "text-emerald-500" : "text-muted-foreground"} />
          </button>
          <button className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Share2 size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Arabic */}
        <p
          className="text-center leading-[2.2] mb-3"
          style={{
            fontFamily: "'Amiri Quran', serif",
            fontSize: 18,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          ﴿{ayah.arabic}﴾
        </p>

        {/* Source */}
        <p className="text-center text-[11px] text-emerald-500/70 mb-3 font-semibold">
          سورة {ayah.surah} — الآية {ayah.ayahNum}
        </p>

        {/* Tafsir toggle */}
        <button
          onClick={() => setShowTafsir(s => !s)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-colors"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <BookOpen size={13} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-emerald-600">
            {showTafsir ? "إخفاء التفسير" : "اقرأ التفسير"}
          </span>
          {showTafsir ? <ChevronUp size={13} className="text-emerald-500" /> : <ChevronDown size={13} className="text-emerald-500" />}
        </button>

        <AnimatePresence>
          {showTafsir && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <p className="text-[12px] leading-loose text-foreground/80 text-right">{ayah.tafsir}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 px-1">
                <Zap size={11} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-600 font-semibold">{ayah.memorize}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Surah Browser ────────────────────────────────────────────────────────────

function SurahBrowser() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"الكل" | "مكية" | "مدنية">("الكل");
  const [expanded, setExpanded] = useState(false);

  const filtered = SURAHS.filter((s) => {
    const matchFilter = filter === "الكل" || s.revelation === filter;
    const matchQuery = !query || s.name.includes(query) || s.nameEn.toLowerCase().includes(query.toLowerCase()) || s.meaning.includes(query);
    return matchFilter && matchQuery;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 8);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن سورة..."
            className="w-full h-9 pr-9 pl-3 rounded-xl text-sm bg-card border border-border/60 focus:outline-none focus:border-primary/50 text-right"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1">
          {(["الكل", "مكية", "مدنية"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: filter === f ? "rgba(200,168,75,0.2)" : "rgba(255,255,255,0.05)",
                color: filter === f ? "#c8a84b" : "rgba(255,255,255,0.5)",
                border: filter === f ? "1px solid rgba(200,168,75,0.35)" : "1px solid transparent",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence>
          {displayed.map((surah, i) => (
            <motion.div
              key={surah.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <a
                href={`https://quran.com/${surah.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 p-3 rounded-xl border border-border/40 bg-card hover:border-amber-400/40 active:scale-[0.97] transition-all block"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "rgba(200,168,75,0.15)", color: "#c8a84b" }}
                  >
                    {surah.id}
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                    style={{
                      background: surah.revelation === "مكية" ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.15)",
                      color: surah.revelation === "مكية" ? "#7c3aed" : "#059669",
                    }}
                  >
                    {surah.revelation}
                  </span>
                </div>
                <p className="font-bold text-sm text-right leading-tight">{surah.name}</p>
                <p className="text-[10px] text-muted-foreground text-right">{surah.ayahCount} آية · ج{surah.juz}</p>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setExpanded(s => !s)}
          className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center gap-2"
          style={{
            background: "rgba(200,168,75,0.08)",
            border: "1px solid rgba(200,168,75,0.2)",
            color: "#c8a84b",
          }}
        >
          {expanded ? <><ChevronUp size={14} /><span>عرض أقل</span></> : <><ChevronDown size={14} /><span>عرض كل السور ({filtered.length})</span></>}
        </button>
      )}
    </div>
  );
}

// ─── Miracles Section ─────────────────────────────────────────────────────────

function MiraclesSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {MIRACLES.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl overflow-hidden cursor-pointer"
          style={{
            background: `linear-gradient(145deg, ${m.color})`,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          onClick={() => setExpanded(expanded === m.id ? null : m.id)}
        >
          <div className="flex items-center gap-3 p-3.5">
            <span className="text-[22px] shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                >
                  {m.category}
                </span>
              </div>
              <p className="font-bold text-sm leading-tight">{m.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{m.description}</p>
            </div>
            <motion.div animate={{ rotate: expanded === m.id ? 180 : 0 }}>
              <ChevronDown size={16} className="text-muted-foreground shrink-0" />
            </motion.div>
          </div>

          <AnimatePresence>
            {expanded === m.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className="mx-3 mb-3 p-3 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[12px] leading-loose text-right" style={{ color: "rgba(255,255,255,0.82)" }}>
                    {m.detail}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Sciences Grid ────────────────────────────────────────────────────────────

function SciencesGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {SCIENCES.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`rounded-2xl p-4 bg-gradient-to-br ${s.gradient} border ${s.border} active:scale-[0.96] transition-all cursor-pointer`}
        >
          <span className="text-[24px] mb-2 block">{s.icon}</span>
          <p className="font-bold text-sm leading-tight mb-1">{s.title}</p>
          <p className="text-[10px] text-muted-foreground leading-snug">{s.description}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>قريباً</span>
            <Sparkles size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Virtues Section ──────────────────────────────────────────────────────────

function VirtuesSection() {
  return (
    <div className="flex flex-col gap-2">
      {VIRTUES.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-start gap-3 p-3.5 rounded-xl"
          style={{
            background: "rgba(200,168,75,0.06)",
            border: "1px solid rgba(200,168,75,0.15)",
          }}
        >
          <span className="text-[20px] shrink-0 leading-none mt-0.5">{v.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-relaxed text-right">«{v.text}»</p>
            <p className="text-[10px] mt-1" style={{ color: "rgba(200,168,75,0.65)" }}>رواه {v.source}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Reading Tracker ──────────────────────────────────────────────────────────

function ReadingTracker() {
  const [pages, setPages] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("quran_pages_today") ?? "0") || 0; } catch { return 0; }
  });
  const [streak, setStreak] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("quran_streak") ?? "0") || 0; } catch { return 0; }
  });

  const addPage = () => {
    const next = pages + 1;
    setPages(next);
    try { localStorage.setItem("quran_pages_today", String(next)); } catch {}
  };

  const resetDay = () => {
    if (pages > 0) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setPages(0);
      try {
        localStorage.setItem("quran_pages_today", "0");
        localStorage.setItem("quran_streak", String(newStreak));
      } catch {}
    }
  };

  const target = 5;
  const progress = Math.min((pages / target) * 100, 100);
  const done = pages >= target;

  return (
    <div
      className="rounded-[22px] p-4"
      style={{
        background: "linear-gradient(145deg, rgba(200,168,75,0.1) 0%, rgba(200,168,75,0.03) 100%)",
        border: "1px solid rgba(200,168,75,0.25)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">ورد القرآن اليومي</h3>
          <p className="text-[11px] text-muted-foreground">هدفك: {target} صفحات يومياً</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(200,168,75,0.12)", border: "1px solid rgba(200,168,75,0.25)" }}>
          <Flame size={13} style={{ color: "#c8a84b" }} />
          <span className="font-bold text-[13px]" style={{ color: "#c8a84b" }}>{streak}</span>
          <span className="text-[10px] text-muted-foreground">يوم</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #c8a84b, #f0d070)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] text-muted-foreground">{pages} / {target} صفحة</span>
        {done && <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1"><Check size={12} />أتممت وردك!</span>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addPage}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #c8a84b, #a07c2a)",
            color: "#1a0e00",
            boxShadow: "0 4px 16px rgba(200,168,75,0.3)",
          }}
        >
          + صفحة قرأتها
        </button>
        {pages > 0 && (
          <button
            onClick={resetDay}
            className="py-2.5 px-3 rounded-xl font-bold text-sm border transition-all active:scale-[0.97]"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#10b981",
            }}
          >
            <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title, sub, accent = "#c8a84b" }: { icon: React.ReactNode; title: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
      >
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div>
        <h2 className="font-bold text-base leading-tight">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { icon: "🎙️", label: "استمع", sub: "تلاوة مباشرة", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", href: "https://quran.com" },
    { icon: "📖", label: "اقرأ", sub: "quran.com", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", href: "https://quran.com" },
    { icon: "🔍", label: "ابحث", sub: "في الآيات", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", href: "https://quran.com/search" },
    { icon: "🌙", label: "حفظ", sub: "مساعد الحفظ", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", href: "https://quran.com" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <a
          key={a.label}
          href={a.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl active:scale-[0.95] transition-all"
          style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
          <span className="text-[22px] leading-none">{a.icon}</span>
          <span className="font-bold text-[12px]" style={{ color: a.color }}>{a.label}</span>
          <span className="text-[9px] text-muted-foreground text-center leading-tight">{a.sub}</span>
        </a>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranPage() {
  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="القرآن الكريم" subtitle="مكتبة شاملة" />

      <div className="px-4 flex flex-col gap-6 pt-4">

        {/* Hero */}
        <QuranHero />

        {/* Quick Actions */}
        <div>
          <SectionTitle icon={<Zap size={16} />} title="ابدأ الآن" sub="تلاوة · بحث · حفظ · استماع" />
          <QuickActions />
        </div>

        {/* Daily Ayah */}
        <div>
          <SectionTitle icon={<Sun size={16} />} title="آية اليوم" sub="مع التفسير الميسّر" accent="#10b981" />
          <DailyAyahCard />
        </div>

        {/* Reading Tracker */}
        <div>
          <SectionTitle icon={<Award size={16} />} title="ورد القرآن" sub="تتبع قراءتك اليومية" />
          <ReadingTracker />
        </div>

        {/* Surah Browser */}
        <div>
          <SectionTitle icon={<BookOpen size={16} />} title="استعرض السور" sub="١١٤ سورة — ابحث أو تصفح" />
          <SurahBrowser />
        </div>

        {/* Sciences */}
        <div>
          <SectionTitle icon={<Brain size={16} />} title="علوم القرآن" sub="رحلة في العلم القرآني" accent="#8b5cf6" />
          <SciencesGrid />
        </div>

        {/* Miracles */}
        <div>
          <SectionTitle icon={<Sparkles size={16} />} title="إعجاز القرآن" sub="حقائق تُذهل العقول" accent="#f59e0b" />
          <MiraclesSection />
        </div>

        {/* Virtues */}
        <div>
          <SectionTitle icon={<Star size={16} />} title="فضل القرآن" sub="أحاديث نبوية شريفة" accent="#c8a84b" />
          <VirtuesSection />
        </div>

        {/* Bottom CTA */}
        <div
          className="rounded-[22px] p-5 text-center"
          style={{
            background: "linear-gradient(145deg, rgba(200,168,75,0.12) 0%, rgba(200,168,75,0.04) 100%)",
            border: "1px solid rgba(200,168,75,0.25)",
          }}
        >
          <p
            className="text-[22px] font-bold mb-1 leading-relaxed"
            style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}
          >
            ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾
          </p>
          <p className="text-[11px] text-muted-foreground mb-4">المزمل: ٤</p>
          <a
            href="https://quran.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: "linear-gradient(135deg, #c8a84b, #a07c2a)",
              color: "#1a0e00",
              boxShadow: "0 4px 16px rgba(200,168,75,0.35)",
            }}
          >
            <BookOpen size={15} />
            افتح مصحف quran.com
          </a>
        </div>

      </div>
    </div>
  );
}
