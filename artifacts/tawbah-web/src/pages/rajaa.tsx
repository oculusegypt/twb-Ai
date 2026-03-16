import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Clock, Search, Heart, X, Play } from "lucide-react";

type VerseCategory = "رجاء" | "ترغيب" | "نعيم" | "طمأنينة";

const AFASY_BASE = "https://everyayah.com/data/Mishari_Rashid_al-Afasy_128kbps/";
function ayahUrl(surah: number, ayah: number) {
  return `${AFASY_BASE}${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
}

const QURAN_VERSES: { id: number; arabic: string; source: string; tag: string; note: string; category: VerseCategory; audioUrl: string }[] = [
  {
    id: 1,
    arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
    source: "سورة الزمر - الآية 53",
    tag: "أرجى آية",
    note: "هذه الآية أرجى آية في القرآن الكريم - قال ابن مسعود: «أرجى آية في كتاب الله». لاحظ: لا استثناء في المغفرة - «الذنوب جميعاً».",
    category: "رجاء",
    audioUrl: ayahUrl(39, 53),
  },
  { id: 2, category: "رجاء", arabic: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا", source: "سورة النساء - الآية 110", tag: "وعد إلهي", note: "وعد إلهي قاطع: من استغفر وجد الله غفوراً رحيماً. الفعل «يجد» يدل على اليقين التام.", audioUrl: ayahUrl(4, 110) },
  { id: 3, category: "رجاء", arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ", source: "سورة البقرة - الآية 222", tag: "محبة الله", note: "الله يُحب التائب. أن تكون محبوب الله هو أعلى درجة يمكن أن يبلغها الإنسان.", audioUrl: ayahUrl(2, 222) },
  { id: 4, category: "رجاء", arabic: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ وَيَعْلَمُ مَا تَفْعَلُونَ", source: "سورة الشورى - الآية 25", tag: "صفة ثابتة", note: "قبول التوبة صفة ثابتة لله، وليس أمراً استثنائياً. «يعلم ما تفعلون» وعلى الرغم من ذلك يقبل ويعفو.", audioUrl: ayahUrl(42, 25) },
  { id: 5, category: "رجاء", arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ ۗ وَكَانَ اللَّهُ غَفُورًا رَّحِيمًا", source: "سورة الفرقان - الآية 70", tag: "تبديل السيئات", note: "بشارة عظيمة: السيئات تتحوّل إلى حسنات للتائب - ليس محوها فحسب، بل تحويلها إلى رصيد إيجابي.", audioUrl: ayahUrl(25, 70) },
  { id: 6, category: "رجاء", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا عَسَىٰ رَبُّكُمْ أَن يُكَفِّرَ عَنكُمْ سَيِّئَاتِكُمْ وَيُدْخِلَكُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ", source: "سورة التحريم - الآية 8", tag: "توبة نصوح", note: "التوبة النصوح تُكفّر السيئات وتفتح باب الجنة.", audioUrl: ayahUrl(66, 8) },
  { id: 7, category: "رجاء", arabic: "وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ وَمَن يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ", source: "سورة آل عمران - الآية 135", tag: "صفة المتقين", note: "الوقوع في الذنب ليس نهايتك - صفة المتقين هي العودة لله فوراً.", audioUrl: ayahUrl(3, 135) },
  { id: 8, category: "رجاء", arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ", source: "سورة النور - الآية 31", tag: "طريق الفلاح", note: "التوبة طريق الفلاح لكل مؤمن.", audioUrl: ayahUrl(24, 31) },
  { id: 9, category: "رجاء", arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", source: "سورة الأعراف - الآية 23", tag: "دعاء آدم", note: "دعاء أبينا آدم فغفر الله له واصطفاه. علّمنا الله هذا الدعاء ليكون سلاحنا.", audioUrl: ayahUrl(7, 23) },
  { id: 10, category: "رجاء", arabic: "نَبِّئْ عِبَادِي أَنِّي أَنَا الْغَفُورُ الرَّحِيمُ", source: "سورة الحجر - الآية 49", tag: "توازن الرجاء", note: "بدأ الله بالمغفرة والرحمة. اجمع بين الخوف والرجاء ولا تُغلّب أحدهما.", audioUrl: ayahUrl(15, 49) },
  { id: 11, category: "رجاء", arabic: "وَالَّذِينَ عَمِلُوا السَّيِّئَاتِ ثُمَّ تَابُوا مِن بَعْدِهَا وَآمَنُوا إِنَّ رَبَّكَ مِن بَعْدِهَا لَغَفُورٌ رَّحِيمٌ", source: "سورة الأعراف - الآية 153", tag: "بعد السيئات", note: "«من بعدها» تأكيد أن الذنوب كانت حقيقية ومع ذلك يغفرها الله.", audioUrl: ayahUrl(7, 153) },
  { id: 12, category: "رجاء", arabic: "وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ ۚ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ", source: "سورة هود - الآية 90", tag: "الله الودود", note: "«ودود» من أسماء الله. التوبة عودة إلى حضرة من يودّك.", audioUrl: ayahUrl(11, 90) },
  { id: 13, category: "رجاء", arabic: "فَمَن تَابَ مِن بَعْدِ ظُلْمِهِ وَأَصْلَحَ فَإِنَّ اللَّهَ يَتُوبُ عَلَيْهِ ۗ إِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ", source: "سورة المائدة - الآية 39", tag: "شرط الإصلاح", note: "التوبة مع الإصلاح مقبولة مضمونة.", audioUrl: ayahUrl(5, 39) },
  { id: 14, category: "رجاء", arabic: "غَافِرِ الذَّنبِ وَقَابِلِ التَّوْبِ شَدِيدِ الْعِقَابِ ذِي الطَّوْلِ", source: "سورة غافر - الآية 3", tag: "اسمه غافر", note: "«غافر الذنب» جاء قبل «شديد العقاب». رحمته سبقت غضبه.", audioUrl: ayahUrl(40, 3) },
  { id: 15, category: "رجاء", arabic: "وَالَّذِي أَطْمَعُ أَن يَغْفِرَ لِي خَطِيئَتِي يَوْمَ الدِّينِ", source: "سورة الشعراء - الآية 82", tag: "دعاء إبراهيم", note: "إبراهيم الخليل نفسه يطمع في المغفرة. فكيف بنا؟", audioUrl: ayahUrl(26, 82) },
  { id: 16, category: "رجاء", arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ۚ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", source: "سورة الطلاق - الآيتان 2-3", tag: "المخرج", note: "من ترك الذنب لله فتح الله له أبواباً لم يتوقعها.", audioUrl: ayahUrl(65, 2) },
  { id: 17, category: "رجاء", arabic: "وَمَن تَابَ وَعَمِلَ صَالِحًا فَإِنَّهُ يَتُوبُ إِلَى اللَّهِ مَتَابًا", source: "سورة الفرقان - الآية 71", tag: "متاب حقيقي", note: "التوبة المقرونة بالعمل الصالح هي التوبة الكاملة.", audioUrl: ayahUrl(25, 71) },
  { id: 18, category: "رجاء", arabic: "رَّبُّكُمْ أَعْلَمُ بِمَا فِي نُفُوسِكُمْ ۚ إِن تَكُونُوا صَالِحِينَ فَإِنَّهُ كَانَ لِلْأَوَّابِينَ غَفُورًا", source: "سورة الإسراء - الآية 25", tag: "للأوابين", note: "«الأواب»: كثير العودة. العودة مراراً أفضل من عدم العودة.", audioUrl: ayahUrl(17, 25) },
  { id: 19, category: "رجاء", arabic: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا فَأُولَٰئِكَ يَدْخُلُونَ الْجَنَّةَ وَلَا يُظْلَمُونَ شَيْئًا", source: "سورة مريم - الآية 60", tag: "دخول الجنة", note: "بابك للجنة مفتوح مهما كان ماضيك.", audioUrl: ayahUrl(19, 60) },
  { id: 20, category: "رجاء", arabic: "وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ", source: "سورة طه - الآية 82", tag: "المغفرة المضمونة", note: "«لغفار» صيغة مبالغة: كثير المغفرة عظيمها.", audioUrl: ayahUrl(20, 82) },

  // ── ترغيب ──────────────────────────────────────────────────────
  { id: 21, category: "ترغيب", arabic: "وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ أُعِدَّتْ لِلْمُتَّقِينَ", source: "سورة آل عمران - الآية 133", tag: "سارع", note: "«وسارعوا» أمر بالإسراع. الجنة عرضها السماوات والأرض تنتظرك. كل خطوة نحو التوبة هي خطوة نحوها.", audioUrl: ayahUrl(3, 133) },
  { id: 22, category: "ترغيب", arabic: "مَن جَاءَ بِالْحَسَنَةِ فَلَهُ عَشْرُ أَمْثَالِهَا ۖ وَمَن جَاءَ بِالسَّيِّئَةِ فَلَا يُجْزَىٰ إِلَّا مِثْلَهَا", source: "سورة الأنعام - الآية 160", tag: "مضاعفة الحسنات", note: "حسنة واحدة بعشر أمثالها. الاستغفار مئة مرة يساوي ألف حسنة. والعمل الصالح بعد التوبة مضاعف.", audioUrl: ayahUrl(6, 160) },
  { id: 23, category: "ترغيب", arabic: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", source: "سورة التوبة - الآية 120", tag: "الأجر محفوظ", note: "كل عمل صالح تفعله محفوظ عند الله لا يضيع منه شيء. توبتك وعبادتك مسجّلة ومؤجَّرة.", audioUrl: ayahUrl(9, 120) },
  { id: 24, category: "ترغيب", arabic: "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", source: "سورة الزلزلة - الآية 7", tag: "لا شيء يضيع", note: "حتى مثقال الذرة من الخير يراه صاحبه. لا تستهن بأي طاعة وأي ورد وأي دعوة صادقة.", audioUrl: ayahUrl(99, 7) },
  { id: 25, category: "ترغيب", arabic: "وَمَن يَتَّقِ اللَّهَ يُكَفِّرْ عَنْهُ سَيِّئَاتِهِ وَيُعْظِمْ لَهُ أَجْرًا", source: "سورة الطلاق - الآية 5", tag: "تكفير وتعظيم", note: "التقوى تجلب أمرين معاً: محو السيئات وتعظيم الأجر. عودتك إلى الله هي بداية هذا الطريق.", audioUrl: ayahUrl(65, 5) },
  { id: 26, category: "ترغيب", arabic: "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا", source: "سورة الكهف - الآية 30", tag: "وعد الإحسان", note: "الله نفسه يؤكد أنه لا يضيع أجر من أحسن. أحسن في توبتك وعبادتك والنتيجة مضمونة.", audioUrl: ayahUrl(18, 30) },
  { id: 27, category: "ترغيب", arabic: "وَمَن يُطِعِ اللَّهَ وَرَسُولَهُ يُدْخِلْهُ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا ۚ وَذَٰلِكَ الْفَوْزُ الْعَظِيمُ", source: "سورة النساء - الآية 13", tag: "الفوز العظيم", note: "الطاعة بعد التوبة مباشرة تُدخل الجنة. «الفوز العظيم» وصف الله للجنة - ولا شيء أعظم منها.", audioUrl: ayahUrl(4, 13) },
  { id: 28, category: "ترغيب", arabic: "وَمَنْ أَرَادَ الْآخِرَةَ وَسَعَىٰ لَهَا سَعْيَهَا وَهُوَ مُؤْمِنٌ فَأُولَٰئِكَ كَانَ سَعْيُهُم مَّشْكُورًا", source: "سورة الإسراء - الآية 19", tag: "السعي مشكور", note: "كل جهد تبذله في طريق الله «مشكور» - أي يشكره الله لك. توبتك وصبرك وجهدك كله مُقدَّر ومشكور.", audioUrl: ayahUrl(17, 19) },

  // ── نعيم ───────────────────────────────────────────────────────
  { id: 29, category: "نعيم", arabic: "فِيهَا مَا تَشْتَهِيهِ الْأَنفُسُ وَتَلَذُّ الْأَعْيُنُ ۖ وَأَنتُمْ فِيهَا خَالِدُونَ", source: "سورة الزخرف - الآية 71", tag: "كل ما تشتهي", note: "كل ما خطر ببالك من متعة ونعيم موجود في الجنة. لا حرمان ولا نقص - «ما تشتهيه الأنفس» بلا استثناء.", audioUrl: ayahUrl(43, 71) },
  { id: 30, category: "نعيم", arabic: "لَهُم مَّا يَشَاءُونَ فِيهَا وَلَدَيْنَا مَزِيدٌ", source: "سورة ق - الآية 35", tag: "فوق المنى", note: "«ولدينا مزيد» - ليس فقط ما يطلبون بل أكثر مما يتخيّلون. الجنة فوق أي توقع أو خيال.", audioUrl: ayahUrl(50, 35) },
  { id: 31, category: "نعيم", arabic: "وَبَشِّرِ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أَنَّ لَهُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ", source: "سورة البقرة - الآية 25", tag: "البشرى", note: "«بشّر» - الخبر سار مؤكد. جنات جمع جنة. أنهار تجري تحت القصور والغرف والأشجار.", audioUrl: ayahUrl(2, 25) },
  { id: 32, category: "نعيم", arabic: "وَرِضْوَانٌ مِّنَ اللَّهِ أَكْبَرُ ۚ ذَٰلِكَ هُوَ الْفَوْزُ الْعَظِيمُ", source: "سورة التوبة - الآية 72", tag: "رضا الله أعلى", note: "فوق كل نعيم الجنة: رضا الله. أن يرضى عنك ربك هو أعلى درجة وأعظم نعمة. التوبة طريق هذا الرضا.", audioUrl: ayahUrl(9, 72) },
  { id: 33, category: "نعيم", arabic: "وُجُوهٌ يَوْمَئِذٍ نَّاعِمَةٌ ۝ لِسَعْيِهَا رَاضِيَةٌ ۝ فِي جَنَّةٍ عَالِيَةٍ", source: "سورة الغاشية - الآيات 8-10", tag: "وجه ناعم راضٍ", note: "وجهك يوم القيامة ناعم مضيء راضٍ. هذا جزاء من سعى ثم تاب ثم عمل. تخيّل تلك اللحظة.", audioUrl: ayahUrl(88, 8) },
  { id: 34, category: "نعيم", arabic: "إِنَّ الْمُتَّقِينَ فِي جَنَّاتٍ وَعُيُونٍ ۝ آخِذِينَ مَا آتَاهُمْ رَبُّهُمْ ۚ إِنَّهُمْ كَانُوا قَبْلَ ذَٰلِكَ مُحْسِنِينَ", source: "سورة الذاريات - الآيات 15-16", tag: "جنات وعيون", note: "«كانوا قبل ذلك محسنين» - لم يكن يُشترط أن يكونوا معصومين، بل محسنين. التائب يصبح محسناً.", audioUrl: ayahUrl(51, 15) },
  { id: 35, category: "نعيم", arabic: "تَعْرِفُ فِي وُجُوهِهِمْ نَضْرَةَ النَّعِيمِ", source: "سورة المطففين - الآية 24", tag: "نضرة النعيم", note: "«نضرة النعيم» تُقرأ على وجوه أهل الجنة. نعيم يُرى ولا يُخفى. كل جهدك في الدنيا سيظهر نوراً على وجهك.", audioUrl: ayahUrl(83, 24) },
  { id: 36, category: "نعيم", arabic: "وَالَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ فِي رَوْضَاتِ الْجَنَّاتِ لَهُم مَّا يَشَاءُونَ عِندَ رَبِّهِمْ", source: "سورة الشورى - الآية 22", tag: "روضات الجنات", note: "«روضات» جمع روضة: البستان الجميل. والأجمل: «عند ربهم» - القرب من الله هو النعيم الأعظم.", audioUrl: ayahUrl(42, 22) },

  // ── طمأنينة ────────────────────────────────────────────────────
  { id: 37, category: "طمأنينة", arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "سورة الرعد - الآية 28", tag: "سر الطمأنينة", note: "أبسط آية وأعمق إجابة: القلب المضطرب لا يهدأ إلا بذكر الله. كل ذكر تقوله الآن هو علاج حقيقي لقلبك.", audioUrl: ayahUrl(13, 28) },
  { id: 38, category: "طمأنينة", arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح - الآيتان 5-6", tag: "يُسر مضمون مرتين", note: "كررها الله مرتين. العلماء يقولون: العسر بالتعريف واحد، واليُسر بالتنكير متعدد. مع كل ضيق يُسران.", audioUrl: ayahUrl(94, 5) },
  { id: 39, category: "طمأنينة", arabic: "يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ۝ ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً ۝ فَادْخُلِي فِي عِبَادِي ۝ وَادْخُلِي جَنَّتِي", source: "سورة الفجر - الآيات 27-30", tag: "نداء الجنة", note: "هذا النداء الإلهي ينتظرك في آخر المسير: «راضية مرضية» - راضية عن الله ومرضية عنها من الله. هدف التوبة.", audioUrl: ayahUrl(89, 27) },
  { id: 40, category: "طمأنينة", arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", source: "سورة الضحى - الآية 5", tag: "ستَرضى", note: "وعد مباشر من الله لك: ستُعطى وسترضى. «سوف» تدل على اليقين مع التراخي - قد يتأخر لكنه آتٍ.", audioUrl: ayahUrl(93, 5) },
  { id: 41, category: "طمأنينة", arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ", source: "سورة الطلاق - الآية 3", tag: "الله حسبك", note: "«فهو حسبه» أي كافيه في كل شيء. حين تتوكل على الله بعد توبتك فالله وحده يكفيك ما تخاف منه.", audioUrl: ayahUrl(65, 3) },
  { id: 42, category: "طمأنينة", arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ", source: "سورة آل عمران - الآية 139", tag: "لا تحزن", note: "«لا تهنوا ولا تحزنوا» نهي عن الضعف والحزن. أنت بتوبتك وإيمانك في موضع علو لا سفول.", audioUrl: ayahUrl(3, 139) },
  { id: 43, category: "طمأنينة", arabic: "وَأَلَّوِ اسْتَقَامُوا عَلَى الطَّرِيقَةِ لَأَسْقَيْنَاهُم مَّاءً غَدَقًا", source: "سورة الجن - الآية 16", tag: "الاستقامة تُسقي", note: "الاستقامة بعد التوبة تجلب الرزق الوفير «ماءً غدقاً». البركة في الحياة ثمرة الثبات على الطريق.", audioUrl: ayahUrl(72, 16) },
  { id: 44, category: "طمأنينة", arabic: "إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا تَتَنَزَّلُ عَلَيْهِمُ الْمَلَائِكَةُ أَلَّا تَخَافُوا وَلَا تَحْزَنُوا وَأَبْشِرُوا بِالْجَنَّةِ", source: "سورة فصلت - الآية 30", tag: "الملائكة تُبشّر", note: "الملائكة تنزل على التائب الثابت وتقول: «لا تخافوا ولا تحزنوا وأبشروا بالجنة». هذه البشرى لك.", audioUrl: ayahUrl(41, 30) },
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

function VerseAudioPlayer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioRef.current?.pause();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        title="استمع بصوت مشاري راشد العفاسي"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border bg-muted/60 border-border text-muted-foreground hover:text-primary hover:border-primary/40"
      >
        <Play size={12} />
        <span>استمع</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={audioRef}
        src={url}
        controls
        autoPlay
        preload="auto"
        className="h-7"
        style={{ minWidth: 140, maxWidth: 180 }}
      />
      <button
        onClick={handleClose}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground"
        title="إغلاق"
      >
        <X size={12} />
      </button>
    </div>
  );
}

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
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-primary font-bold">{v.source}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <VerseAudioPlayer url={v.audioUrl} />
                            <button onClick={() => setExpanded(isOpen ? null : key)} className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                              {isOpen ? "إغلاق" : "تأمل ▾"}
                            </button>
                          </div>
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
