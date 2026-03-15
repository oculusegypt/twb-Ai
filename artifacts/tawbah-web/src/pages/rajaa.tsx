import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Clock } from "lucide-react";

const QURAN_VERSES = [
  {
    id: 1,
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
    source: "سورة الزمر - الآية 53",
    note: "هذه الآية أرجى آية في القرآن الكريم - لا استثناء في المغفرة",
  },
  {
    id: 2,
    arabic: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا",
    source: "سورة النساء - الآية 110",
    note: "وعد إلهي قاطع: الاستغفار يعقبه الغفران",
  },
  {
    id: 3,
    arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ",
    source: "سورة البقرة - الآية 222",
    note: "الله يُحب التائب - التوبة تحوّلك إلى محبوب الله",
  },
  {
    id: 4,
    arabic: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ وَيَعْلَمُ مَا تَفْعَلُونَ",
    source: "سورة الشورى - الآية 25",
    note: "قبول التوبة صفة ثابتة لله تعالى، وليس استثناءً",
  },
  {
    id: 5,
    arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ",
    source: "سورة النور - الآية 31",
    note: "التوبة طريق الفلاح لكل مؤمن بلا استثناء",
  },
  {
    id: 6,
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا عَسَىٰ رَبُّكُمْ أَن يُكَفِّرَ عَنكُمْ سَيِّئَاتِكُمْ",
    source: "سورة التحريم - الآية 8",
    note: "التوبة النصوح تُكفّر السيئات كلها",
  },
  {
    id: 7,
    arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ",
    source: "سورة الفرقان - الآية 70",
    note: "بشرى عظيمة: السيئات تتحول إلى حسنات للتائب",
  },
];

const HADITHS = [
  {
    id: 1,
    arabic: "«لَلَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ مِنْ أَحَدِكُمْ سَقَطَ عَلَى بَعِيرِهِ وَقَدْ أَضَلَّهُ فِي أَرْضٍ فَلَاةٍ»",
    source: "رواه مسلم",
    note: "تأمل: الله أشد فرحاً بتوبتك من هذا الرجل الذي وجد بعيره في الصحراء",
  },
  {
    id: 2,
    arabic: "«إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ، وَيَبْسُطُ يَدَهُ بِالنَّهَارِ لِيَتُوبَ مُسِيءُ اللَّيْلِ»",
    source: "رواه مسلم",
    note: "باب التوبة مفتوح ليلاً ونهاراً، لا يُغلق إلا عند الغرغرة أو طلوع الشمس من مغربها",
  },
  {
    id: 3,
    arabic: "«كُلُّ ابْنِ آدَمَ خَطَّاءٌ، وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ»",
    source: "رواه الترمذي وابن ماجه",
    note: "الخطأ طبيعة بشرية، لكن العودة إلى الله هي ما يُميّز التائبين",
  },
  {
    id: 4,
    arabic: "«مَنْ تَابَ قَبْلَ أَنْ تَطْلُعَ الشَّمْسُ مِنْ مَغْرِبِهَا تَابَ اللَّهُ عَلَيْهِ»",
    source: "رواه مسلم",
    note: "ما دامت الشمس تشرق من المشرق، باب التوبة مفتوح لك",
  },
  {
    id: 5,
    arabic: "«لَوْ أَخْطَأْتُمْ حَتَّى تَبْلُغَ خَطَايَاكُمُ السَّمَاءَ، ثُمَّ تُبْتُمْ لَتَابَ اللَّهُ عَلَيْكُمْ»",
    source: "رواه ابن ماجه",
    note: "مهما بلغت ذنوبك، رحمة الله أوسع منها",
  },
  {
    id: 6,
    arabic: "«يَا ابْنَ آدَمَ، إِنَّكَ مَا دَعَوْتَنِي وَرَجَوْتَنِي غَفَرْتُ لَكَ عَلَى مَا كَانَ فِيكَ وَلَا أُبَالِي»",
    source: "حديث قدسي - رواه الترمذي",
    note: "ربك يقول لك مباشرة: ادعني وارجني، سأغفر لك",
  },
];

const STORIES = [
  {
    id: 1,
    title: "قاتل المئة نفس",
    period: "قصة من الأحاديث",
    story: "رجل قتل تسعةً وتسعين نفساً، ثم سأل عالماً: هل له من توبة؟ قال له: اذهب إلى قرية كذا فيها أناس يعبدون الله. فانطلق، فأدركه الموت في الطريق. فتنازعت فيه ملائكة الرحمة وملائكة العذاب. فأوحى الله إليهم أن قيسوا المسافة بينه وبين القريتين، فوُجد أقرب إلى القرية الصالحة بشبر، فغُفر له.",
    lesson: "الدرس: حتى قاتل المئة نفس يغفر الله له، فكيف بمن ذنبه أقل؟",
    source: "متفق عليه",
  },
  {
    id: 2,
    title: "توبة كعب بن مالك رضي الله عنه",
    period: "صحابي جليل",
    story: "تخلّف كعب بن مالك عن غزوة تبوك دون عذر، فلما رجع النبي ﷺ صارحه بالحقيقة، فجُفي خمسين يوماً حتى ضاقت عليه الأرض بما رحبت. ثم نزل القرآن بقبول توبته: «وَعَلَى الثَّلَاثَةِ الَّذِينَ خُلِّفُوا...». قال كعب: ما أنعم الله عليّ نعمة قط بعد الإسلام أعظم من توبتي تلك.",
    lesson: "الدرس: حتى التخلف عن رسول الله ﷺ يُغفر لصاحبه إن صدق في توبته.",
    source: "متفق عليه",
  },
  {
    id: 3,
    title: "الفضيل بن عياض - من قاطع طريق إلى إمام",
    period: "من التابعين",
    story: "كان الفضيل بن عياض قاطع طريق يسرق المسافرين. وذات ليلة سمع أحدهم يتلو: «أَلَمْ يَأْنِ لِلَّذِينَ آمَنُوا أَن تَخْشَعَ قُلُوبُهُمْ لِذِكْرِ اللَّهِ» فوقعت هذه الآية في قلبه كالسهم، وقال: بلى يا رب، قد آن! فتاب على الفور. وأصبح من أئمة الزهد والعلم والتقوى.",
    lesson: "الدرس: لحظة واحدة من الإيمان تغيّر حياة الإنسان كله.",
    source: "كتب التراجم",
  },
  {
    id: 4,
    title: "المرأة الغامدية",
    period: "صحابية",
    story: "جاءت امرأة إلى النبي ﷺ وقالت: يا رسول الله، طهّرني. فسألها النبي ﷺ فأخبرته. فأمر بها فرُجمت. فلما كفّنوها صلى عليها النبي ﷺ. فقال عمر: تصلي عليها وقد زنت؟ فقال النبي ﷺ: «لقد تابت توبةً لو قُسِّمت على سبعين من أهل المدينة لوسعتهم».",
    lesson: "الدرس: الصدق في التوبة يرفع صاحبه إلى درجات عالية جداً.",
    source: "رواه مسلم",
  },
];

type TabType = "quran" | "hadith" | "stories";

export default function Rajaa() {
  const [activeTab, setActiveTab] = useState<TabType>("quran");
  const [expanded, setExpanded] = useState<number | null>(null);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "quran", label: "آيات الرجاء", icon: <BookOpen size={16} /> },
    { id: "hadith", label: "أحاديث التوبة", icon: <Sparkles size={16} /> },
    { id: "stories", label: "قصص التائبين", icon: <Clock size={16} /> },
  ];

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-4 mb-4">
        <h1 className="text-2xl font-display font-bold mb-1">مكتبة الرجاء</h1>
        <p className="text-sm text-muted-foreground">آيات وأحاديث وقصص تملأ القلب بالأمل والرجاء</p>
      </div>

      <div className="px-5 mb-5">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpanded(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-card text-primary shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {activeTab === "quran" && QURAN_VERSES.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <p className="font-display text-base leading-loose text-foreground mb-3 text-center">{v.arabic}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary font-bold">{v.source}</span>
                  <button
                    onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded === v.id ? "إخفاء" : "التأمل"}
                  </button>
                </div>
                {expanded === v.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 pt-3 border-t border-border/50"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.note}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {activeTab === "hadith" && HADITHS.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <p className="font-display text-base leading-loose text-foreground mb-3 text-center">{h.arabic}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary font-bold">{h.source}</span>
                  <button
                    onClick={() => setExpanded(expanded === h.id + 100 ? null : h.id + 100)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded === h.id + 100 ? "إخفاء" : "التأمل"}
                  </button>
                </div>
                {expanded === h.id + 100 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 pt-3 border-t border-border/50"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{h.note}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {activeTab === "stories" && STORIES.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm">{s.title}</h3>
                    <span className="text-[10px] text-muted-foreground">{s.period}</span>
                  </div>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">{s.source}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {expanded === s.id + 200 ? s.story : s.story.slice(0, 120) + "..."}
                </p>
                <button
                  onClick={() => setExpanded(expanded === s.id + 200 ? null : s.id + 200)}
                  className="text-xs text-primary font-bold"
                >
                  {expanded === s.id + 200 ? "إخفاء" : "اقرأ القصة كاملة"}
                </button>
                {expanded === s.id + 200 && (
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="text-xs text-primary font-bold leading-relaxed">{s.lesson}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
