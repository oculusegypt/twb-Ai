import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Clock, Search, Heart, X } from "lucide-react";

const QURAN_VERSES = [
  {
    id: 1,
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
    source: "سورة الزمر - الآية 53",
    tag: "أرجى آية",
    note: "هذه الآية أرجى آية في القرآن الكريم - قال ابن مسعود: «أرجى آية في كتاب الله». لاحظ: لا استثناء في المغفرة - «الذنوب جميعاً».",
  },
  {
    id: 2,
    arabic: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا",
    source: "سورة النساء - الآية 110",
    tag: "وعد إلهي",
    note: "وعد إلهي قاطع: من استغفر وجد الله غفوراً رحيماً. الفعل «يجد» يدل على اليقين التام.",
  },
  {
    id: 3,
    arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ",
    source: "سورة البقرة - الآية 222",
    tag: "محبة الله",
    note: "الله يُحب التائب. أن تكون محبوب الله هو أعلى درجة يمكن أن يبلغها الإنسان.",
  },
  {
    id: 4,
    arabic: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ وَيَعْلَمُ مَا تَفْعَلُونَ",
    source: "سورة الشورى - الآية 25",
    tag: "صفة ثابتة",
    note: "قبول التوبة صفة ثابتة لله، وليس أمراً استثنائياً. «يعلم ما تفعلون» وعلى الرغم من ذلك يقبل ويعفو.",
  },
  {
    id: 5,
    arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ ۗ وَكَانَ اللَّهُ غَفُورًا رَّحِيمًا",
    source: "سورة الفرقان - الآية 70",
    tag: "تبديل السيئات",
    note: "بشارة عظيمة لم تأتِ في شريعة قبلنا: السيئات تتحوّل إلى حسنات للتائب - ليس محوها فحسب، بل تحويلها إلى رصيد إيجابي.",
  },
  {
    id: 6,
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا عَسَىٰ رَبُّكُمْ أَن يُكَفِّرَ عَنكُمْ سَيِّئَاتِكُمْ وَيُدْخِلَكُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ",
    source: "سورة التحريم - الآية 8",
    tag: "توبة نصوح",
    note: "التوبة النصوح هي التي تُكفّر السيئات وتفتح باب الجنة. «نصوح» من النصح: أي خالصة صادقة لا تترك للذنب بقية.",
  },
  {
    id: 7,
    arabic: "وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ وَمَن يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ",
    source: "سورة آل عمران - الآية 135",
    tag: "صفة المتقين",
    note: "هذه صفة المتقين: أنهم إذا وقعوا في الذنب لم يستمروا فيه، بل ذكروا الله واستغفروا. الوقوع في الذنب ليس نهايتك.",
  },
  {
    id: 8,
    arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ",
    source: "سورة النور - الآية 31",
    tag: "طريق الفلاح",
    note: "التوبة طريق الفلاح لكل مؤمن. «جميعاً» تشمل الصغير والكبير، الذنب العظيم والصغير.",
  },
  {
    id: 9,
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    source: "سورة الأعراف - الآية 23",
    tag: "دعاء آدم",
    note: "هذا دعاء أبينا آدم وأمنا حواء حين أخطآ في الجنة، فغفر الله لهما واصطفاهما. علّمنا الله هذا الدعاء ليكون سلاحنا.",
  },
  {
    id: 10,
    arabic: "نَبِّئْ عِبَادِي أَنِّي أَنَا الْغَفُورُ الرَّحِيمُ ۙ وَأَنَّ عَذَابِي هُوَ الْعَذَابُ الْأَلِيمُ",
    source: "سورة الحجر - الآيتان 49-50",
    tag: "توازن الخوف والرجاء",
    note: "بدأ الله بالمغفرة والرحمة قبل ذكر العذاب. هذا يُعلّمنا أن نجمع بين الخوف والرجاء - ولا نغلّب أحدهما على الآخر.",
  },
  {
    id: 11,
    arabic: "وَالَّذِينَ عَمِلُوا السَّيِّئَاتِ ثُمَّ تَابُوا مِن بَعْدِهَا وَآمَنُوا إِنَّ رَبَّكَ مِن بَعْدِهَا لَغَفُورٌ رَّحِيمٌ",
    source: "سورة الأعراف - الآية 153",
    tag: "بعد السيئات",
    note: "«من بعدها» يدل على أن الذنوب كانت موجودة حقيقةً، ومع ذلك يغفرها الله. لا يشترط أن تكون طاهراً قبل التوبة.",
  },
  {
    id: 12,
    arabic: "وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ ۚ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ",
    source: "سورة هود - الآية 90",
    tag: "الله الودود",
    note: "«ودود» من أسماء الله: يودّ عباده، وإن أحبوه أحبهم. التوبة ليست استسلاماً بل عودة إلى حضرة من يودّك.",
  },
  {
    id: 13,
    arabic: "فَمَن تَابَ مِن بَعْدِ ظُلْمِهِ وَأَصْلَحَ فَإِنَّ اللَّهَ يَتُوبُ عَلَيْهِ ۗ إِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ",
    source: "سورة المائدة - الآية 39",
    tag: "شرط الإصلاح",
    note: "التوبة المقرونة بالإصلاح مقبولة مضمونة. «يتوب عليه» أي يرجع بالقبول والرضا عليه. الإصلاح دليل صدق التوبة.",
  },
  {
    id: 14,
    arabic: "غَافِرِ الذَّنبِ وَقَابِلِ التَّوْبِ شَدِيدِ الْعِقَابِ ذِي الطَّوْلِ ۖ لَا إِلَٰهَ إِلَّا هُوَ ۖ إِلَيْهِ الْمَصِيرُ",
    source: "سورة غافر - الآية 3",
    tag: "اسمه غافر",
    note: "اسم الله «غافر الذنب» جاء قبل «شديد العقاب» في الترتيب. رحمته سبقت غضبه. وهو «قابل التوب» أي يقبل كل توبة صادقة.",
  },
  {
    id: 15,
    arabic: "وَالَّذِي أَطْمَعُ أَن يَغْفِرَ لِي خَطِيئَتِي يَوْمَ الدِّينِ",
    source: "سورة الشعراء - الآية 82",
    tag: "دعاء إبراهيم",
    note: "هذا دعاء إبراهيم الخليل عليه السلام - خليل الله نفسه. إن كان الخليل يطمع في المغفرة، فمن أولى منا بهذا الطمع؟",
  },
  {
    id: 16,
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۚ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    source: "سورة الطلاق - الآيتان 2-3",
    tag: "المخرج",
    note: "التوبة والتقوى يفتحان أبواباً لم تكن تتوقعها. من ترك الذنب لله بدّله الله خيراً.",
  },
  {
    id: 17,
    arabic: "وَمَن تَابَ وَعَمِلَ صَالِحًا فَإِنَّهُ يَتُوبُ إِلَى اللَّهِ مَتَابًا",
    source: "سورة الفرقان - الآية 71",
    tag: "متاب حقيقي",
    note: "التوبة المقرونة بالعمل الصالح هي التوبة الحقيقية. لا يكفي الكف عن الذنب فحسب، بل لا بد من ملء الفراغ بالخير.",
  },
  {
    id: 18,
    arabic: "رَّبُّكُمْ أَعْلَمُ بِمَا فِي نُفُوسِكُمْ ۚ إِن تَكُونُوا صَالِحِينَ فَإِنَّهُ كَانَ لِلْأَوَّابِينَ غَفُورًا",
    source: "سورة الإسراء - الآية 25",
    tag: "للأوابين",
    note: "«الأواب»: كثير العودة إلى الله. حتى من يتكرر منه الذنب ثم يتوب، الله غفور له. أن تعود مراراً أفضل من ألا تعود أبداً.",
  },
  {
    id: 19,
    arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا فَأُولَٰئِكَ يَدْخُلُونَ الْجَنَّةَ وَلَا يُظْلَمُونَ شَيْئًا",
    source: "سورة مريم - الآية 60",
    tag: "دخول الجنة",
    note: "بعد وصف أهل الشر جاء الاستثناء العظيم: «إلا من تاب». بابك للجنة مفتوح مهما كان ماضيك.",
  },
  {
    id: 20,
    arabic: "وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ",
    source: "سورة طه - الآية 82",
    tag: "المغفرة المضمونة",
    note: "«لغفار» صيغة مبالغة: كثير المغفرة، عظيمها. وعد إلهي بالمغفرة لمن جمع التوبة والإيمان والعمل الصالح.",
  },
];

const HADITHS = [
  {
    id: 1,
    arabic: "«لَلَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ مِنْ أَحَدِكُمْ سَقَطَ عَلَى بَعِيرِهِ وَقَدْ أَضَلَّهُ فِي أَرْضٍ فَلَاةٍ»",
    source: "متفق عليه",
    tag: "فرح الله",
    note: "تأمل هذا التشبيه: رجل في صحراء فقد راحلته وطعامه وشرابه، ثم وجدها. فرح الله بتوبتك أشد من فرح هذا الرجل. أنت ثمين عند الله.",
  },
  {
    id: 2,
    arabic: "«إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ، وَيَبْسُطُ يَدَهُ بِالنَّهَارِ لِيَتُوبَ مُسِيءُ اللَّيْلِ، حَتَّى تَطْلُعَ الشَّمْسُ مِنْ مَغْرِبِهَا»",
    source: "رواه مسلم",
    tag: "الباب مفتوح",
    note: "ليلاً ونهاراً - لا توقف ولا إغلاق لباب التوبة. الله ينتظرك الآن بيده الممدودة. لا تجعله ينتظر.",
  },
  {
    id: 3,
    arabic: "«كُلُّ ابْنِ آدَمَ خَطَّاءٌ، وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ»",
    source: "رواه الترمذي وابن ماجه",
    tag: "طبيعة بشرية",
    note: "الخطأ طبيعة بشرية، والنبي ﷺ لا يعيب عليك وقوعك في الذنب بل يُخبرك أن الأفضل أن تتوب. أنت الآن تسير في طريق الخيار.",
  },
  {
    id: 4,
    arabic: "«مَنْ تَابَ قَبْلَ أَنْ تَطْلُعَ الشَّمْسُ مِنْ مَغْرِبِهَا تَابَ اللَّهُ عَلَيْهِ»",
    source: "رواه مسلم",
    tag: "المهلة واسعة",
    note: "ما دامت الشمس تشرق من المشرق، باب التوبة مفتوح لك. ونحن اليوم مازلنا في هذه النعمة.",
  },
  {
    id: 5,
    arabic: "«لَوْ أَخْطَأْتُمْ حَتَّى تَبْلُغَ خَطَايَاكُمُ السَّمَاءَ، ثُمَّ تُبْتُمْ، لَتَابَ اللَّهُ عَلَيْكُمْ»",
    source: "رواه ابن ماجه",
    tag: "لا حد للمغفرة",
    note: "خطايا تبلغ السماء؟ ومع ذلك التوبة تمحوها. هذا يعني أن ذنوبك مهما كانت لا تساوي شيئاً أمام سعة رحمة الله.",
  },
  {
    id: 6,
    arabic: "«يَا ابْنَ آدَمَ، إِنَّكَ مَا دَعَوْتَنِي وَرَجَوْتَنِي غَفَرْتُ لَكَ عَلَى مَا كَانَ فِيكَ وَلَا أُبَالِي، يَا ابْنَ آدَمَ، لَوْ بَلَغَتْ ذُنُوبُكَ عَنَانَ السَّمَاءِ ثُمَّ اسْتَغْفَرْتَنِي غَفَرْتُ لَكَ»",
    source: "حديث قدسي - رواه الترمذي",
    tag: "كلام الله مباشرة",
    note: "ربك يُخاطبك مباشرة: «ادعني وارجني سأغفر لك». «ولا أبالي» - يعني أن ذنوبك صغيرة جداً أمام قدرته وكرمه.",
  },
  {
    id: 7,
    arabic: "«التَّائِبُ مِنَ الذَّنْبِ كَمَنْ لَا ذَنْبَ لَهُ»",
    source: "رواه ابن ماجه",
    tag: "الصفحة البيضاء",
    note: "بعد التوبة الصادقة أنت كمن لم يذنب قط. لا ذاكرة، لا سجل، لا أثر. صفحة بيضاء ناصعة.",
  },
  {
    id: 8,
    arabic: "«إِنَّ اللَّهَ تَعَالَى يَقْبَلُ تَوْبَةَ الْعَبْدِ مَا لَمْ يُغَرْغِرْ»",
    source: "رواه الترمذي",
    tag: "حتى اللحظة الأخيرة",
    note: "ما لم تبدأ الروح في الخروج، باب التوبة مفتوح. لكن لا تغتر - فالأجل مجهول والتوبة الآن أسلم.",
  },
  {
    id: 9,
    arabic: "«أَنَا عِنْدَ ظَنِّ عَبْدِي بِي، فَلْيَظُنَّ بِي مَا شَاءَ»",
    source: "حديث قدسي - رواه أحمد",
    tag: "حسن الظن بالله",
    note: "ظنّ بالله الخير. من ظن أن الله سيغفر له وتاب إليه - الله عند ظنه. اجعل ظنك بالله حسناً دائماً.",
  },
  {
    id: 10,
    arabic: "«إِنَّ الشَّيْطَانَ قَالَ: وَعِزَّتِكَ لَا أَبْرَحُ أُغْوِي عِبَادَكَ مَا دَامَتْ أَرْوَاحُهُمْ فِي أَجْسَادِهِمْ. فَقَالَ الرَّبُّ: وَعِزَّتِي وَجَلَالِي لَا أَزَالُ أَغْفِرُ لَهُمْ مَا اسْتَغْفَرُونِي»",
    source: "حديث قدسي - رواه أحمد",
    tag: "الله يتحدى إبليس",
    note: "إبليس أقسم أن يُغوي الناس، والله أقسم أن يغفر لمن استغفر. المعركة بين إبليس ومغفرة الله - فلا تُعط إبليس النصر بالإحباط.",
  },
  {
    id: 11,
    arabic: "«مَا مِنْ عَبْدٍ يُذْنِبُ ذَنْبًا فَيَتَوَضَّأُ فَيُحْسِنُ الوُضُوءَ، ثُمَّ يُصَلِّي رَكْعَتَيْنِ، ثُمَّ يَسْتَغْفِرُ اللَّهَ إِلَّا غَفَرَ اللَّهُ لَهُ»",
    source: "رواه أبو داود والترمذي",
    tag: "خطوات محددة",
    note: "وصفة واضحة وسهلة: وضوء + ركعتان + استغفار = مغفرة. لا كاهن ولا وسيط - أنت وربك مباشرة.",
  },
  {
    id: 12,
    arabic: "«يَعْجَبُ رَبُّكَ مِنْ شَابٍّ لَيْسَتْ لَهُ صَبْوَةٌ»",
    source: "رواه أحمد",
    tag: "الشاب التائب",
    note: "إن كنت شاباً وتبت، فأنت من أعجب الناس عند الله. والأصعب دائماً له أجر أعظم.",
  },
  {
    id: 13,
    arabic: "«إِنَّ لِلَّهِ مِائَةَ رَحْمَةٍ، أَنْزَلَ مِنْهَا رَحْمَةً وَاحِدَةً بَيْنَ الجِنِّ وَالإِنْسِ وَالبَهَائِمِ وَالهَوَامِّ، فَبِهَا يَتَعَاطَفُونَ... وَأَخَّرَ اللَّهُ تِسْعًا وَتِسْعِينَ رَحْمَةً يَرْحَمُ بِهَا عِبَادَهُ يَوْمَ القِيَامَةِ»",
    source: "متفق عليه",
    tag: "99 رحمة باقية",
    note: "كل الرحمة الموجودة في الدنيا - في قلب الأم، بين الأصدقاء، عطف الناس - هي رحمة واحدة من مئة. والله يُجمع الـ 99 الباقية يوم القيامة للمؤمنين.",
  },
  {
    id: 14,
    arabic: "«إِذَا تَقَرَّبَ الْعَبْدُ إِلَيَّ شِبْرًا تَقَرَّبْتُ إِلَيْهِ ذِرَاعًا، وَإِذَا تَقَرَّبَ مِنِّي ذِرَاعًا تَقَرَّبْتُ مِنْهُ بَاعًا، وَإِذَا أَتَانِي يَمْشِي أَتَيْتُهُ هَرْوَلَةً»",
    source: "حديث قدسي - متفق عليه",
    tag: "مبادرة الله",
    note: "كلما تقربت خطوة تقرب الله أضعافها. التوبة خطوة واحدة منك - والله يأتيك هرولة. أنت لن تخسر أبداً.",
  },
  {
    id: 15,
    arabic: "«لَوْ لَمْ تُذْنِبُوا لَذَهَبَ اللَّهُ بِكُمْ، وَجَاءَ بِقَوْمٍ يُذْنِبُونَ فَيَسْتَغْفِرُونَ اللَّهَ فَيَغْفِرُ لَهُمْ»",
    source: "رواه مسلم",
    tag: "حكمة الذنب",
    note: "الذنب والتوبة منه يُظهران عظمة المغفرة الإلهية. لستَ بلا قيمة بسبب ذنبك - بل في توبتك إظهار لكرم الله.",
  },
];

const STORIES = [
  {
    id: 1,
    title: "قاتل المئة نفس",
    period: "قصة قرآنية",
    icon: "⚖️",
    story: "رجل قتل تسعةً وتسعين نفساً، فسأل عالماً عن توبته فقال: لا توبة لك. فقتله فأتمّ المئة. ثم سأل عالماً آخر فقال: ومن يحول بينك وبين التوبة؟ اذهب إلى قرية كذا ففيها عباد. فانطلق فأدركه الموت في الطريق. فتنازعت فيه ملائكة الرحمة والعذاب. فأوحى الله أن قيسوا المسافة بينه وبين القريتين، فوُجد أقرب للقرية الصالحة بشبر، فغُفر له.",
    lesson: "حتى قاتل المئة يغفر الله له. الدرس: لا تقنط، والعالم السيئ قد يكون بوابة الشيطان لإحباطك.",
    source: "متفق عليه",
  },
  {
    id: 2,
    title: "توبة كعب بن مالك رضي الله عنه",
    period: "صحابي جليل",
    icon: "🌟",
    story: "تخلّف كعب بن مالك عن غزوة تبوك دون عذر. فلما رجع النبي ﷺ صارحه بالحقيقة وقال: كذبت. فجُفي خمسين يوماً لا يُكلّمه أحد، حتى ضاقت عليه الأرض بما رحبت وضاقت عليه نفسه. ثم نزل القرآن بقبول توبته: «وَعَلَى الثَّلَاثَةِ الَّذِينَ خُلِّفُوا». قال كعب: ما أنعم الله عليّ نعمة قط بعد الإسلام أعظم من توبتي تلك.",
    lesson: "حتى التخلف عن رسول الله ﷺ يُغفر. الصدق مع الله ومع نفسك هو سر القبول.",
    source: "متفق عليه",
  },
  {
    id: 3,
    title: "الفضيل بن عياض - من لص إلى إمام",
    period: "من التابعين",
    icon: "🔄",
    story: "كان الفضيل بن عياض قاطع طريق يسرق ويقطع الطريق على المسافرين. وذات ليلة سمع أحدهم يتلو: «أَلَمْ يَأْنِ لِلَّذِينَ آمَنُوا أَن تَخْشَعَ قُلُوبُهُمْ لِذِكْرِ اللَّهِ»، فوقعت هذه الآية في قلبه كالسهم، وقال: بلى يا رب، قد آن! فتاب على الفور. فأصبح من أئمة الزهد والعلم حتى قيل: من أراد أن يرى خائفاً فليرَ الفضيل.",
    lesson: "لحظة واحدة من الإيمان الحقيقي تغيّر مسار الحياة كلها. القرآن هو المحرّك الأعظم للقلوب.",
    source: "حلية الأولياء",
  },
  {
    id: 4,
    title: "المرأة الغامدية",
    period: "صحابية",
    icon: "💎",
    story: "جاءت امرأة من غامد إلى النبي ﷺ فقالت: يا رسول الله، طهّرني. فقال: ارجعي فاستغفري الله وتوبي إليه. قالت: تردّني كما رددت ماعزاً؟ والله إني حُبلى. فأمر بها فرُجمت. فلما كفّنها، صلى عليها النبي ﷺ. فقال عمر: تصلي عليها يا نبي الله وقد زنت؟ فقال ﷺ: «لقد تابت توبةً لو قُسِّمت على سبعين من أهل المدينة لوسعتهم».",
    lesson: "الصدق في الندم والسعي للتطهر يرفع صاحبه إلى درجات عظيمة جداً. التائب الصادق محبوب عند الله.",
    source: "رواه مسلم",
  },
  {
    id: 5,
    title: "ماعز بن مالك الأسلمي",
    period: "صحابي",
    icon: "🏃",
    story: "جاء ماعز بن مالك الأسلمي إلى النبي ﷺ وقال: إني أصبت حداً فطهّرني. فردّه النبي مراراً وهو يعود. فأقيم عليه الحد. فلما انصرفوا قال النبي ﷺ: «استغفروا لماعز بن مالك»، فقالوا: غفر الله لماعز! فقال النبي ﷺ: «لقد تاب توبةً لو قُسِّمت على أمة لوسعتها».",
    lesson: "المبادرة الذاتية بالتوبة والتطهير من أعظم علامات الإيمان الراسخ. لم يُكره ماعز بل جاء من نفسه.",
    source: "رواه مسلم",
  },
  {
    id: 6,
    title: "أبو نواس الشاعر",
    period: "العصر العباسي",
    icon: "✍️",
    story: "أبو نواس: الشاعر الشهير بالمجون والخمر. في أواخر حياته تاب توبةً صادقة وقال أبياته الشهيرة: «إلهي لستُ للفردوس أهلاً، ولا أقوى على نار الجحيم». وكانت يلازم الورع والبكاء وكتابة شعر التوبة حتى مات. قيل إنه مات وقد غُفر له لحسن ختامه.",
    lesson: "لا يأس من رحمة الله مهما طال الذنب. حسن الختام هو الغاية، والله يعلم ما في القلوب.",
    source: "كتب التاريخ",
  },
  {
    id: 7,
    title: "فتى تاب من كلمة سمعها",
    period: "قصة من التراث",
    icon: "👂",
    story: "حُكي أن فتىً كان في مجلس لهو، فسمع منادياً ينادي: «أيها الغافل، ما هذا الغفلة؟ أما تستحي؟». فوقعت الكلمة في قلبه كالنار. فقام وترك المجلس وبكى حتى أصبح. ثم لزم العلم والعبادة. فلما ذكر قصته قال: كم من كلمة أنقذت صاحبها من الهلاك!",
    lesson: "أي موقف أو كلمة يمكن أن تكون نقطة التحول. أنت الآن ربما في هذه اللحظة.",
    source: "مختصر منهاج القاصدين",
  },
  {
    id: 8,
    title: "الرجل الذي أوصى بحرق جثته",
    period: "قصة من الأحاديث",
    icon: "🔥",
    story: "قال رجل لبنيه: إذا أنا متّ فأحرقوني ثم ذرّوا نصف رمادي في البر ونصفه في البحر، فوالله لئن قدر الله عليّ ليُعذبنّه عذاباً لا يُعذّبه أحداً. فلما مات فعلوا ذلك. فأمر الله البر والبحر فجمعا ما فيهما. ثم قال الله: لم فعلت ذلك؟ قال: من خشيتك يا رب. فغفر الله له.",
    lesson: "الخوف من الله مقبول عند الله. هذا الرجل لم يظن أن الله يغفر له، لكن خوفه كان سبب نجاته.",
    source: "متفق عليه",
  },
  {
    id: 9,
    title: "يونس عليه السلام في بطن الحوت",
    period: "قصة قرآنية",
    icon: "🐋",
    story: "ذهب يونس عليه السلام مغاضباً ربه دون إذنه، فابتلعه الحوت في الظلمات الثلاث. فنادى: «لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ». فاستجاب الله له وأخرجه إلى اليابسة. قال تعالى: «وَكَذَٰلِكَ نُنجِي الْمُؤْمِنِينَ» - وهذه الآية لك أيضاً.",
    lesson: "حتى الأنبياء يتوبون وينيبون. والدعاء في أشد اللحظات ظلاماً هو مفتاح الفرج.",
    source: "سورة الأنبياء - 87",
  },
  {
    id: 10,
    title: "عمر بن الخطاب - من مُعادٍ إلى خليفة",
    period: "صحابي جليل",
    icon: "🌙",
    story: "عمر بن الخطاب كان من أشد أعداء الإسلام، وقد همّ بقتل النبي ﷺ. فلما أسلم لم يمضِ وقت طويل حتى أصبح ثاني أعظم شخصية في الإسلام. قال النبي ﷺ: «لو كان بعدي نبي لكان عمر». ماذا يعني ذلك؟ يعني أن تاريخ الإنسان لا يُحدد مستقبله، التوبة تُعيد البناء من الصفر.",
    lesson: "أعدى أعداء الإسلام صار ثاني المسلمين. لا شيء مستحيل مع الإيمان الصادق.",
    source: "متفق عليه",
  },
  {
    id: 11,
    title: "إبراهيم بن أدهم - الأمير الزاهد",
    period: "من التابعين",
    icon: "👑",
    story: "كان إبراهيم بن أدهم أميراً على بلخ، له المُلك والجاه والنعمة. وذات ليلة سمع صوتاً على سطح قصره فقام مذعوراً فوجد رجلاً. قال: من أنت؟ قال: أنا فلان أريد أن أرعى إبلي على سطح قصرك. قال: هذا موضع لا يُرعى فيه! قال: وبمثل ذلك اشتُريت هذه الدنيا فتركتها. فتاب من فوره وترك مُلكه وأقبل على العلم والعبادة.",
    lesson: "الدنيا لا تساوي أن تضيع نفسك فيها. الحكمة في أوقات الرخاء أغلى من المُلك.",
    source: "طبقات الصوفية",
  },
  {
    id: 12,
    title: "بشر بن الحارث الحافي",
    period: "من التابعين",
    icon: "📄",
    story: "كان بشر الحافي رجلاً من أهل اللهو والشراب في بغداد. ثم وجد ذات يوم ورقةً في الطريق مكتوب فيها «بسم الله الرحمن الرحيم». فرفعها إجلالاً لاسم الله وطيّبها بالطيب ووضعها في مكان شريف. فرأى في المنام قائلاً يقول: طيّبت اسمي وسأطيّب ذكرك في الدنيا والآخرة. فأصبح تائباً زاهداً حتى عُدّ من كبار العلماء.",
    lesson: "حسنة واحدة خالصة لله يمكن أن تكون بداية التحول الكامل في حياة الإنسان.",
    source: "حلية الأولياء",
  },
];

type TabType = "quran" | "hadith" | "stories";

export default function Rajaa() {
  const [activeTab, setActiveTab] = useState<TabType>("quran");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("rajaa_favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = (key: string) => {
    const updated = new Set(favorites);
    if (updated.has(key)) updated.delete(key);
    else updated.add(key);
    setFavorites(updated);
    localStorage.setItem("rajaa_favorites", JSON.stringify([...updated]));
  };

  const filteredVerses = useMemo(() => {
    return QURAN_VERSES.filter(v => {
      const matchSearch = !search || v.arabic.includes(search) || v.source.includes(search) || v.note.includes(search) || v.tag.includes(search);
      const matchFav = !showFavoritesOnly || favorites.has(`q_${v.id}`);
      return matchSearch && matchFav;
    });
  }, [search, showFavoritesOnly, favorites]);

  const filteredHadiths = useMemo(() => {
    return HADITHS.filter(h => {
      const matchSearch = !search || h.arabic.includes(search) || h.source.includes(search) || h.note.includes(search) || h.tag.includes(search);
      const matchFav = !showFavoritesOnly || favorites.has(`h_${h.id}`);
      return matchSearch && matchFav;
    });
  }, [search, showFavoritesOnly, favorites]);

  const filteredStories = useMemo(() => {
    return STORIES.filter(s => {
      const matchSearch = !search || s.title.includes(search) || s.story.includes(search) || s.lesson.includes(search);
      const matchFav = !showFavoritesOnly || favorites.has(`s_${s.id}`);
      return matchSearch && matchFav;
    });
  }, [search, showFavoritesOnly, favorites]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "quran", label: "آيات الرجاء", icon: <BookOpen size={13} />, count: QURAN_VERSES.length },
    { id: "hadith", label: "الأحاديث", icon: <Sparkles size={13} />, count: HADITHS.length },
    { id: "stories", label: "قصص التائبين", icon: <Clock size={13} />, count: STORIES.length },
  ];

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-4 mb-3">
        <h1 className="text-2xl font-display font-bold mb-0.5">مكتبة الرجاء</h1>
        <p className="text-sm text-muted-foreground">آيات وأحاديث وقصص تملأ القلب بالأمل</p>

        <div className="flex gap-2 mt-3">
          <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المكتبة..."
              className="flex-1 bg-transparent text-sm outline-none text-right placeholder:text-muted-foreground/60"
              dir="rtl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 rounded-xl border transition-all ${showFavoritesOnly ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"}`}
          >
            <Heart size={16} className={showFavoritesOnly ? "fill-primary-foreground" : ""} />
          </button>
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpanded(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === tab.id ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1 rounded-full ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted-foreground/20"}`}>
                {tab.count}
              </span>
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
            {activeTab === "quran" && (
              <>
                {filteredVerses.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">لا نتائج</div>
                )}
                {filteredVerses.map((v, i) => {
                  const key = `q_${v.id}`;
                  const isFav = favorites.has(key);
                  const isOpen = expanded === key;
                  return (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`bg-card rounded-xl border transition-all ${isOpen ? "border-primary/30" : "border-border"}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">{v.tag}</span>
                          <button onClick={() => toggleFavorite(key)} className="shrink-0 p-0.5">
                            <Heart size={15} className={`transition-colors ${isFav ? "fill-red-400 text-red-400" : "text-muted-foreground/40"}`} />
                          </button>
                        </div>
                        <p className="font-display text-[15px] leading-loose text-foreground mb-3 text-center">{v.arabic}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-primary font-bold">{v.source}</span>
                          <button onClick={() => setExpanded(isOpen ? null : key)} className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                            {isOpen ? "إغلاق" : "تأمل ▾"}
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border/50"
                          >
                            <div className="px-4 py-3 bg-primary/5">
                              <p className="text-xs text-foreground/80 leading-relaxed">{v.note}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </>
            )}

            {activeTab === "hadith" && (
              <>
                {filteredHadiths.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">لا نتائج</div>
                )}
                {filteredHadiths.map((h, i) => {
                  const key = `h_${h.id}`;
                  const isFav = favorites.has(key);
                  const isOpen = expanded === key;
                  return (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`bg-card rounded-xl border transition-all ${isOpen ? "border-secondary/40" : "border-border"}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold shrink-0">{h.tag}</span>
                          <button onClick={() => toggleFavorite(key)} className="shrink-0 p-0.5">
                            <Heart size={15} className={`transition-colors ${isFav ? "fill-red-400 text-red-400" : "text-muted-foreground/40"}`} />
                          </button>
                        </div>
                        <p className="font-display text-[14px] leading-loose text-foreground mb-3 text-center">{h.arabic}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary font-bold">{h.source}</span>
                          <button onClick={() => setExpanded(isOpen ? null : key)} className="text-xs text-muted-foreground hover:text-secondary transition-colors font-medium">
                            {isOpen ? "إغلاق" : "تأمل ▾"}
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border/50"
                          >
                            <div className="px-4 py-3 bg-secondary/5">
                              <p className="text-xs text-foreground/80 leading-relaxed">{h.note}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </>
            )}

            {activeTab === "stories" && (
              <>
                {filteredStories.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">لا نتائج</div>
                )}
                {filteredStories.map((s, i) => {
                  const key = `s_${s.id}`;
                  const isFav = favorites.has(key);
                  const isOpen = expanded === key;
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`bg-card rounded-xl border transition-all ${isOpen ? "border-amber-400/40" : "border-border"}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{s.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-sm leading-tight">{s.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{s.period}</span>
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">{s.source}</span>
                                </div>
                              </div>
                              <button onClick={() => toggleFavorite(key)} className="shrink-0 p-0.5">
                                <Heart size={15} className={`transition-colors ${isFav ? "fill-red-400 text-red-400" : "text-muted-foreground/40"}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                          {isOpen ? s.story : s.story.slice(0, 130) + "..."}
                        </p>

                        <button
                          onClick={() => setExpanded(isOpen ? null : key)}
                          className="mt-2 text-xs text-amber-600 font-bold"
                        >
                          {isOpen ? "إخفاء ▴" : "اقرأ القصة كاملة ▾"}
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-amber-400/20 bg-amber-500/5 rounded-lg p-3">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                  💡 {s.lesson}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
