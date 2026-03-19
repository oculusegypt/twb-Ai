import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  BookOpen, Scale, ShieldAlert, Heart, Info, Plus, Check, X
} from "lucide-react";

type SinCategory = "with_kaffarah" | "major" | "common" | "huquq_ibad";

interface Sin {
  id: string;
  name: string;
  icon: string;
  category: SinCategory;
  severity: "kabira" | "saghira";
  desc: string;
  daleel: string;
  conditions: string[];
  kaffarahId?: string;
  kaffarahLabel?: string;
  warning?: string;
  note?: string;
}

const SINS: Sin[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1) ذنوب لها كفارة شرعية محددة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "iftar_ramadan",
    name: "الإفطار العمد في رمضان",
    icon: "🌙",
    category: "with_kaffarah",
    severity: "kabira",
    desc: "تعمّد الأكل أو الشرب أو الجماع نهار رمضان بغير عذر شرعي من أعظم الذنوب، وقد جاء فيه وعيد شديد، وتلزمه كفارة مغلّظة.",
    daleel: "«مَن أفطَرَ يوماً من رمضانَ من غيرِ رُخصةٍ ولا مَرَضٍ لم يَقضِه صيامُ الدهرِ كلِّه وإن صامَه» — حديث أبو داود",
    conditions: [
      "الإقلاع الفوري والإمساك بقية اليوم",
      "التوبة الصادقة والندم الحقيقي",
      "قضاء اليوم المُفطَر بعد رمضان",
      "أداء الكفارة الشرعية المغلّظة بالترتيب",
    ],
    kaffarahId: "iftar_ramadan",
    kaffarahLabel: "كفارة الإفطار العمد",
    warning: "الكفارة بالترتيب: عتق رقبة، فإن عجز فصيام شهرين متتابعين، فإن عجز فإطعام 60 مسكيناً.",
  },
  {
    id: "yamin",
    name: "الحنث في اليمين",
    icon: "🤝",
    category: "with_kaffarah",
    severity: "kabira",
    desc: "من حلف بالله على فعل شيء ثم لم يفعله، أو حلف على ترك شيء ثم فعله، وجبت عليه كفارة اليمين.",
    daleel: "«وَلَٰكِن يُؤَاخِذُكُم بِمَا عَقَّدتُّمُ الْأَيْمَانَ ۖ فَكَفَّارَتُهُ إِطْعَامُ عَشَرَةِ مَسَاكِينَ» — المائدة 89",
    conditions: [
      "التأكد أن اليمين كانت بالله حقاً (لا باسم العادة)",
      "ألا يكون الحنث قسراً أو نسياناً",
      "أداء الكفارة قبل إعادة الحنث",
      "العزم على صون اليمين مستقبلاً",
    ],
    kaffarahId: "yamin",
    kaffarahLabel: "كفارة اليمين",
    note: "إن كان الحلف بغير الله (بالنبي أو الكعبة) فلا كفارة، بل التوبة من الشرك.",
  },
  {
    id: "dhihar",
    name: "الظهار",
    icon: "🏠",
    category: "with_kaffarah",
    severity: "kabira",
    desc: "أن يقول الزوج لزوجته: «أنتِ عليّ كظهر أمي» تحريماً لها، وهو منكر وزور حرّمه الإسلام.",
    daleel: "«الَّذِينَ يُظَاهِرُونَ مِنكُم مِّن نِّسَائِهِم مَّا هُنَّ أُمَّهَاتِهِمْ» — المجادلة 2",
    conditions: [
      "التوبة الفورية وعدم الإعادة",
      "أداء الكفارة قبل مسيس الزوجة",
      "استئناف العلاقة الزوجية بعد الكفارة فقط",
    ],
    kaffarahId: "dhihar",
    kaffarahLabel: "كفارة الظهار",
    warning: "الكفارة بالترتيب الصارم: عتق رقبة → صيام شهرين متتابعين → إطعام 60 مسكيناً. لا يحل الجماع قبل إتمامها.",
  },
  {
    id: "qatl",
    name: "القتل الخطأ",
    icon: "⚖️",
    category: "with_kaffarah",
    severity: "kabira",
    desc: "قتل نفس مؤمنة خطأً بغير قصد، كحوادث السيارات أو الإهمال الطبي.",
    daleel: "«وَمَن قَتَلَ مُؤْمِنًا خَطَـًٔا فَتَحْرِيرُ رَقَبَةٍ مُّؤْمِنَةٍ وَدِيَةٌ مُّسَلَّمَةٌ إِلَىٰ أَهْلِهِ» — النساء 92",
    conditions: [
      "الحزن والندم الحقيقي على ما جرى",
      "أداء الدية لأهل المقتول كاملة",
      "أداء الكفارة الشرعية",
      "الدعاء المستمر للمقتول بالرحمة",
    ],
    kaffarahId: "qatl",
    kaffarahLabel: "كفارة القتل الخطأ",
    warning: "الدية والكفارة واجبتان معاً ولا تسقط إحداهما بالأخرى.",
  },
  {
    id: "haj_itha",
    name: "الأذى في الإحرام",
    icon: "🕋",
    category: "with_kaffarah",
    severity: "kabira",
    desc: "ارتكاب محظور من محظورات الإحرام كحلق الشعر أو لبس المخيط أو الطيب لعذر.",
    daleel: "«فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ بِهِ أَذًى مِّن رَّأْسِهِ فَفِدْيَةٌ مِّن صِيَامٍ أَوْ صَدَقَةٍ أَوْ نُسُكٍ» — البقرة 196",
    conditions: [
      "التوبة والاستغفار سواء كان عمداً أو نسياناً",
      "اختيار أحد بدائل الكفارة",
    ],
    kaffarahId: "haj_itha",
    kaffarahLabel: "فدية الأذى في الإحرام",
    note: "الخيار للمحرم: صيام 3 أيام، أو إطعام 6 مساكين، أو ذبح شاة.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2) كبائر لها شروط توبة خاصة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "zina",
    name: "الزنا",
    icon: "🔥",
    category: "major",
    severity: "kabira",
    desc: "من أعظم الكبائر بعد الشرك والقتل، وهو مُحبط للأعمال ومُبعد من رحمة الله حتى تتحقق التوبة النصوح.",
    daleel: "«وَلَا تَقْرَبُوا الزِّنَا ۖ إِنَّهُ كَانَ فَاحِشَةً وَسَاءَ سَبِيلًا» — الإسراء 32",
    conditions: [
      "الإقلاع الفوري والبتات عن كل ما يقرّب من الذنب",
      "الاغتسال من الجنابة فوراً",
      "الندم القلبي العميق مع الدموع",
      "سدّ كل ذريعة: حذف التطبيقات، تغيير الأرقام، قطع العلاقة",
      "صلاة ركعتين للتوبة",
      "التفكير الجاد في الزواج الشرعي",
      "الإكثار من الصيام كاسر للشهوة",
    ],
    warning: "لا كفارة مالية محددة، لكن التوبة لا تصح بدون سد كل ذريعة تُعيد لهذا الذنب.",
  },
  {
    id: "nazar_haram",
    name: "النظر الحرام والأفلام المحرمة",
    icon: "👁️",
    category: "major",
    severity: "kabira",
    desc: "إدمان النظر الحرام والأفلام الإباحية من أمراض العصر، وهو زنا العين وقد يؤدي لزنا الفرج، ويُميت القلب.",
    daleel: "«النَّظَرُ سَهمٌ مَسمومٌ مِن سِهامِ إبليسَ» — الحديث",
    conditions: [
      "حذف كل تطبيقات وروابط المحتوى الحرام فوراً",
      "تفعيل فلاتر الحماية على الأجهزة",
      "التوبة الصادقة مع الندم",
      "غض البصر في الحياة اليومية",
      "الإكثار من الذكر كلما جاء الإغراء",
      "البحث عن مجتمع دعم أو شخص موثوق",
    ],
  },
  {
    id: "istimna",
    name: "الاستمناء",
    icon: "⚠️",
    category: "major",
    severity: "kabira",
    desc: "محرّم بالجمهور ومُضرّ بالجسد والروح، ويُضعف الإرادة ويقسّي القلب، والعلاج هو الزواج أو الصوم.",
    daleel: "«وَالَّذِينَ هُمْ لِفُرُوجِهِمْ حَافِظُونَ» — المؤمنون 5",
    conditions: [
      "الإقلاع الفوري",
      "الاغتسال من الجنابة",
      "قطع كل المحفزات (نظر، أفلام، خيال)",
      "الإكثار من الصيام",
      "التفكير الجاد في الزواج",
    ],
    note: "يلزمه الغسل دائماً، والتوبة تكفيه دون كفارة مالية.",
  },
  {
    id: "tark_salah",
    name: "ترك الصلاة",
    icon: "🕌",
    category: "major",
    severity: "kabira",
    desc: "ترك الصلاة كفر عند بعض العلماء، وكبيرة عظيمة عند الجمهور، وهو الحد الفاصل بين المسلم والكافر.",
    daleel: "«بين الرجل وبين الكفر والشرك ترك الصلاة» — مسلم",
    conditions: [
      "التوبة الصادقة الفورية",
      "قضاء الصلوات الفائتة على خلاف بين العلماء (القضاء أحوط)",
      "الالتزام بالصلوات الخمس في وقتها من الآن",
      "البدء بصلاة الجماعة",
    ],
    warning: "جمهور العلماء على وجوب قضاء الصلوات الفائتة وإن كثرت.",
  },
  {
    id: "riba",
    name: "أكل الربا",
    icon: "💰",
    category: "major",
    severity: "kabira",
    desc: "من أكبر الكبائر وقد أعلن الله حرباً على آكله، ويشمل الفوائد البنكية والقروض الربوية.",
    daleel: "«يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَذَرُوا مَا بَقِيَ مِنَ الرِّبَا» — البقرة 278",
    conditions: [
      "التوقف الفوري عن كل معاملة ربوية",
      "رد الفائدة الربوية في الصدقة (لا يُنتفع بها)",
      "استبدال العقود الربوية بعقود إسلامية",
      "التوبة الصادقة مع الندم",
    ],
    warning: "الفائدة الربوية المكتسبة لا يحل الانتفاع بها، بل تُصرف في وجوه البر بنية التخلص لا التصدق.",
  },
  {
    id: "uquq",
    name: "عقوق الوالدين",
    icon: "👨‍👩‍👦",
    category: "major",
    severity: "kabira",
    desc: "من أكبر الكبائر بعد الشرك بالله مباشرة، والعقوق كل أذى وإهانة يُحزن الوالد أو الوالدة.",
    daleel: "«وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا» — الإسراء 23",
    conditions: [
      "الاعتذار الصادق للوالدين بالكلام",
      "الرجوع إلى الطاعة والبر الفعلي",
      "الدعاء لهما في كل صلاة",
      "إن كانا قد توفيا: الدعاء والصدقة عنهما",
    ],
  },
  {
    id: "sihr",
    name: "السحر",
    icon: "🌑",
    category: "major",
    severity: "kabira",
    desc: "من الكبائر المهلكة، ومن فعل السحر فقد أشرك بالله، وتوبته تستلزم شروطاً دقيقة.",
    daleel: "«وَمَا يُعَلِّمَانِ مِنْ أَحَدٍ حَتَّىٰ يَقُولَا إِنَّمَا نَحْنُ فِتْنَةٌ فَلَا تَكْفُرْ» — البقرة 102",
    conditions: [
      "التوبة الصادقة من الشرك",
      "إبطال السحر وحل العقد إن أمكن",
      "التبرؤ من كل أسباب السحر والسحرة",
      "التجديد الكامل للعلاقة مع الله بالتوحيد",
    ],
    warning: "من مات على السحر ولم يتب فحكمه عند الله خطير. البدء بالإخلاص للتوحيد أولاً.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3) ذنوب حقوق العباد
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "ghiba",
    name: "الغيبة والنميمة",
    icon: "👅",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "الغيبة: ذكر أخاك بما يكره وهو غائب. النميمة: النقل بين الناس لإيقاع الفتنة. كلتاهما من كبائر اللسان.",
    daleel: "«أَيُحِبُّ أَحَدُكُمْ أَن يَأْكُلَ لَحْمَ أَخِيهِ مَيْتًا» — الحجرات 12",
    conditions: [
      "التوبة الصادقة والكف عن الغيبة فوراً",
      "الاستحلال ممن اغتبته إن أمكن (إن لم يُفضِ لفتنة أكبر)",
      "التعويض بالثناء على من اغتبته في المجالس ذاتها",
      "الإكثار من الاستغفار عن لسانك",
    ],
    note: "العلماء اختلفوا في الاستحلال: إن كان صاحبه لا يعلم فالأرجح أن لا تُعلمه وتكثر الدعاء له.",
  },
  {
    id: "sarqa",
    name: "السرقة والغش",
    icon: "🤲",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "أخذ مال الغير بغير حق، أو الغش في البيع والشراء والعمل. من أكبر الذنوب المتعلقة بحقوق العباد.",
    daleel: "«وَالسَّارِقُ وَالسَّارِقَةُ فَاقْطَعُوا أَيْدِيَهُمَا» — المائدة 38",
    conditions: [
      "رد المال المسروق لصاحبه كاملاً",
      "إن لم يعرف صاحبه: تصدّق بالقدر المماثل",
      "التوبة الصادقة مع الندم",
      "الالتزام بالكسب الحلال من الآن",
    ],
    warning: "لا تُقبل التوبة من السارق حتى يرد ما أخذ أو يستحل صاحبه.",
  },
  {
    id: "kazib",
    name: "الكذب والخداع",
    icon: "🗣️",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "الكذب من أخلاق المنافقين، وكل كذبة ضررها يمتد لصاحبها ولمن كُذب عليه.",
    daleel: "«وَيْلٌ لِّكُلِّ أَفَّاكٍ أَثِيمٍ» — الجاثية 7",
    conditions: [
      "الرجوع عن الكذبة وإصلاح ضررها",
      "الاعتراف لمن كُذب عليه إن أمكن",
      "العزم الصادق على لزوم الصدق أبداً",
      "كفارة اليمين إن كان الكذب مصحوباً بحلف",
    ],
  },
  {
    id: "zulm_maal",
    name: "أكل أموال الناس بالباطل",
    icon: "💸",
    category: "huquq_ibad",
    severity: "kabira",
    desc: "الاستيلاء على أموال الناس بالظلم أو الاحتيال أو التلاعب في الأعمال، من الذنوب التي لا تُغفر حتى يُرد الحق.",
    daleel: "«من كانت له مظلمة لأخيه فليتحلله منه اليوم قبل أن لا يكون دينار ولا درهم» — البخاري",
    conditions: [
      "رد الأموال المأخوذة بالكامل",
      "إن مات صاحبها: تصدّق عنه أو أوصل لورثته",
      "التوبة الصادقة",
      "تطهير مصادر دخلك كلها",
    ],
    warning: "حقوق العباد المالية لا تسقط بالتوبة وحدها ولا بالصلاة. لا بد من الرد.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4) ذنوب شائعة (لا تحتاج شروطاً خاصة)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "ghadab",
    name: "الغضب وسوء المعاملة",
    icon: "😤",
    category: "common",
    severity: "saghira",
    desc: "الغضب جمرة يُلقيها الشيطان في قلب المؤمن، ويؤدي لذنوب كثيرة كالسب والإيذاء.",
    daleel: "«ليس الشديد بالصُّرَعة، إنما الشديد الذي يملك نفسه عند الغضب» — متفق عليه",
    conditions: [
      "التوبة والاستغفار عند كل مرة تغضب فيها",
      "الاعتذار لمن أسأت إليه بسبب الغضب",
      "تدريب النفس: التعوذ، الوضوء، الجلوس، الصمت",
    ],
  },
  {
    id: "israf",
    name: "الإسراف والتبذير",
    icon: "🛍️",
    category: "common",
    severity: "saghira",
    desc: "التبذير في المال والطعام والوقت نهاهم الله عنه، وهو من أسباب ضيق الرزق ومحق البركة.",
    daleel: "«وَلَا تُسْرِفُوا ۚ إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ» — الأنعام 141",
    conditions: [
      "التوبة والاستغفار",
      "وضع ميزانية شهرية ومحاسبة النفس",
      "التصدق بما فضل كإصلاح لما بذّر",
    ],
  },
  {
    id: "tafrit_nawafil",
    name: "التفريط في النوافل والأوراد",
    icon: "📿",
    category: "common",
    severity: "saghira",
    desc: "ترك النوافل الراتبة كقيام الليل وسنن الصلوات وأذكار الصباح والمساء يُضعف القلب ويُفقده النور.",
    daleel: "«من حافظ على شفعة الضحى غُفرت ذنوبه وإن كانت مثل زبد البحر» — الترمذي",
    conditions: [
      "العودة للأوراد والأذكار اليومية",
      "البدء بالسهل وعدم الانقطاع",
    ],
  },
  {
    id: "su_dhan",
    name: "سوء الظن بالله والناس",
    icon: "🌑",
    category: "common",
    severity: "saghira",
    desc: "سوء الظن بالله من الكبائر، وبالناس من الذنوب التي تفسد القلب والعلاقات.",
    daleel: "«إياكم والظن فإن الظن أكذب الحديث» — متفق عليه",
    conditions: [
      "التوبة وحسن الظن بالله دائماً",
      "تدريب النفس على التفسير الحسن لأفعال الناس",
      "الاستغفار عند كل خاطر سيئ",
    ],
  },
  {
    id: "lahw",
    name: "اللهو المحرم والغناء",
    icon: "🎵",
    category: "common",
    severity: "saghira",
    desc: "الموسيقى والغناء المحرم وآلات اللهو، وإضاعة الوقت في الترفيه الحرام.",
    daleel: "«وَمِنَ النَّاسِ مَن يَشْتَرِي لَهْوَ الْحَدِيثِ لِيُضِلَّ عَن سَبِيلِ اللَّهِ» — لقمان 6",
    conditions: [
      "التوبة والإقلاع",
      "ملء الوقت بالقرآن والذكر بديلاً",
    ],
  },
  {
    id: "tark_amr_bil_maruf",
    name: "ترك الأمر بالمعروف",
    icon: "🤫",
    category: "common",
    severity: "saghira",
    desc: "السكوت عن المنكر حيث يجب الإنكار قصور في أداء حق الله وحق الأمة.",
    daleel: "«من رأى منكم منكراً فليغيّره بيده...» — مسلم",
    conditions: [
      "التوبة من السكوت",
      "البدء بالإنكار بالقلب على الأقل دائماً",
      "تعلّم الطريقة الصحيحة للنهي عن المنكر",
    ],
  },
];

const CATEGORY_META: Record<SinCategory, {
  label: string; desc: string; color: string; bg: string; icon: React.ReactNode
}> = {
  with_kaffarah: {
    label: "لها كفارة شرعية",
    desc: "تستلزم كفارة محددة بالشرع",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 border-red-400/30",
    icon: <Scale size={14} />,
  },
  major: {
    label: "كبائر بشروط توبة",
    desc: "لا كفارة مالية لكن لها شروط توبة خاصة",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-400/30",
    icon: <ShieldAlert size={14} />,
  },
  huquq_ibad: {
    label: "حقوق العباد",
    desc: "لا تُغفر إلا برد الحقوق",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-400/30",
    icon: <Heart size={14} />,
  },
  common: {
    label: "ذنوب شائعة",
    desc: "توبة نصوح تكفيها",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-400/30",
    icon: <BookOpen size={14} />,
  },
};

type FilterType = "all" | SinCategory;

function addKaffarahToLocal(kaffarahId: string) {
  try {
    const saved = localStorage.getItem("selected_kaffarahs");
    const arr: string[] = saved ? JSON.parse(saved) : [];
    if (!arr.includes(kaffarahId)) {
      arr.push(kaffarahId);
      localStorage.setItem("selected_kaffarahs", JSON.stringify(arr));
    }
  } catch {}
}

function SinDetailSheet({ sin, onClose }: { sin: Sin; onClose: () => void }) {
  const [added, setAdded] = useState(() => {
    try {
      const saved = localStorage.getItem("selected_kaffarahs");
      const arr: string[] = saved ? JSON.parse(saved) : [];
      return sin.kaffarahId ? arr.includes(sin.kaffarahId) : false;
    } catch { return false; }
  });

  const meta = CATEGORY_META[sin.category];

  const handleAddKaffarah = () => {
    if (sin.kaffarahId) {
      addKaffarahToLocal(sin.kaffarahId);
      setAdded(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm pt-3 pb-2 px-5 border-b border-border/50 z-10">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sin.icon}</span>
            <div className="flex-1">
              <h2 className="font-bold text-base">{sin.name}</h2>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                {meta.icon}
                {meta.label}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{sin.desc}</p>

          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-start gap-2">
              <BookOpen size={13} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">{sin.daleel}</p>
            </div>
          </div>

          {sin.warning && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3.5">
              <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-relaxed">{sin.warning}</p>
            </div>
          )}

          {sin.note && (
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3.5">
              <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{sin.note}</p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary" />
              شروط التوبة والإصلاح
            </h3>
            <div className="flex flex-col gap-2">
              {sin.conditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed">{cond}</p>
                </div>
              ))}
            </div>
          </div>

          {sin.kaffarahId && (
            <div className="bg-gradient-to-l from-red-500/10 to-orange-500/5 border border-red-400/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={15} className="text-red-500" />
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400">
                  {sin.kaffarahLabel}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                هذا الذنب له كفارة شرعية محددة. يمكنك إضافتها لقائمة خطة الكفارة ومتابعة تنفيذها.
              </p>
              {added ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-emerald-600 dark:text-emerald-400">
                  <Check size={16} />
                  <span className="text-sm font-bold">أُضيفت للخطة</span>
                  <Link href="/kaffarah" className="mr-auto text-xs underline underline-offset-2" onClick={onClose}>
                    انتقل للخطة ←
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAddKaffarah}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md shadow-red-500/20"
                >
                  <Plus size={16} />
                  أضف الكفارة لخطتي
                </button>
              )}
            </div>
          )}

          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SinCard({ sin, onClick }: { sin: Sin; onClick: () => void }) {
  const meta = CATEGORY_META[sin.category];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 bg-card border border-border rounded-xl px-4 py-3.5 text-right active:scale-[0.98] transition-all hover:shadow-sm hover:border-border/80"
    >
      <span className="text-2xl shrink-0">{sin.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{sin.name}</p>
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${meta.bg} ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>
      {sin.kaffarahId && (
        <Scale size={14} className="text-red-400 shrink-0" />
      )}
      <ChevronDown size={15} className="text-muted-foreground shrink-0 -rotate-90" />
    </motion.button>
  );
}

export default function SinsList() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSin, setSelectedSin] = useState<Sin | null>(null);

  const filtered = filter === "all" ? SINS : SINS.filter(s => s.category === filter);

  const counts: Record<FilterType, number> = {
    all: SINS.length,
    with_kaffarah: SINS.filter(s => s.category === "with_kaffarah").length,
    major: SINS.filter(s => s.category === "major").length,
    huquq_ibad: SINS.filter(s => s.category === "huquq_ibad").length,
    common: SINS.filter(s => s.category === "common").length,
  };

  const filters: { key: FilterType; label: string; short: string }[] = [
    { key: "all", label: "الكل", short: "الكل" },
    { key: "with_kaffarah", label: "لها كفارة", short: "كفارة" },
    { key: "major", label: "كبائر", short: "كبائر" },
    { key: "huquq_ibad", label: "حقوق العباد", short: "عباد" },
    { key: "common", label: "شائعة", short: "شائعة" },
  ];

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="flex items-center gap-3 px-5 pt-4 mb-1">
        <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-muted/50 text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold">قائمة الذنوب الذكية</h1>
          <p className="text-xs text-muted-foreground">اعرف ذنبك وشروط توبته</p>
        </div>
      </div>

      <div className="mx-5 mt-3 mb-4 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          اضغط على أي ذنب لتعرف شروط التوبة منه. الذنوب ذات الكفارة يمكن إضافتها مباشرة لخطتك.
        </p>
      </div>

      <div className="px-5 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {f.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-white/20" : "bg-muted"}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filter !== "all" && (
        <div className={`mx-5 mb-4 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${CATEGORY_META[filter as SinCategory]?.bg} ${CATEGORY_META[filter as SinCategory]?.color}`}>
          {CATEGORY_META[filter as SinCategory]?.icon}
          <span>{CATEGORY_META[filter as SinCategory]?.desc}</span>
        </div>
      )}

      <div className="px-5 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((sin, i) => (
            <motion.div
              key={sin.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
            >
              <SinCard sin={sin} onClick={() => setSelectedSin(sin)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSin && (
          <SinDetailSheet sin={selectedSin} onClose={() => setSelectedSin(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
