import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, CheckCircle, Volume2, VolumeX, Sun, Moon,
  Star, Loader2, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type AdhkarType = "morning" | "evening";

interface AdhkarItem {
  id: string;
  arabic: string;
  transliteration?: string;
  source: string;
  count: number;
  isQuran?: boolean;
  surah?: number;
  ayah?: string;
  audioHint?: string;
}

// ─── Morning Adhkar Data ─────────────────────────────────────────────────────

const MORNING_ADHKAR: AdhkarItem[] = [
  {
    id: "m1", count: 1, source: "سورة البقرة: ٢٥٥", isQuran: true, surah: 2,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    audioHint: "آية الكرسي"
  },
  {
    id: "m2", count: 3, source: "سورة الإخلاص", isQuran: true, surah: 112,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    audioHint: "سورة الإخلاص"
  },
  {
    id: "m3", count: 3, source: "سورة الفلق", isQuran: true, surah: 113,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    audioHint: "سورة الفلق"
  },
  {
    id: "m4", count: 3, source: "سورة الناس", isQuran: true, surah: 114,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
    audioHint: "سورة الناس"
  },
  {
    id: "m5", count: 1, source: "أبو داود والترمذي",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ"
  },
  {
    id: "m6", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ"
  },
  {
    id: "m7", count: 1, source: "البخاري — سيد الاستغفار",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ"
  },
  {
    id: "m8", count: 3, source: "أبو داود والترمذي",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا"
  },
  {
    id: "m9", count: 4, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ"
  },
  {
    id: "m10", count: 1, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ"
  },
  {
    id: "m11", count: 7, source: "أبو داود وابن ماجه",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ"
  },
  {
    id: "m12", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ"
  },
  {
    id: "m13", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ"
  },
  {
    id: "m14", count: 3, source: "أبو داود وابن ماجه",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ"
  },
  {
    id: "m15", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ وَالْجُذَامِ وَمِنْ سَيِّئِ الْأَسْقَامِ"
  },
  {
    id: "m16", count: 2, source: "الترمذي وابن ماجه",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي"
  },
  {
    id: "m17", count: 10, source: "الترمذي والنسائي",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "m18", count: 100, source: "البخاري ومسلم",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
  },
  {
    id: "m19", count: 33, source: "مسلم",
    arabic: "سُبْحَانَ اللَّهِ"
  },
  {
    id: "m20", count: 33, source: "مسلم",
    arabic: "الْحَمْدُ لِلَّهِ"
  },
  {
    id: "m21", count: 34, source: "مسلم",
    arabic: "اللَّهُ أَكْبَرُ"
  },
  {
    id: "m22", count: 10, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ"
  },
  {
    id: "m23", count: 3, source: "أبو داود والترمذي",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ"
  },
  {
    id: "m24", count: 1, source: "الترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا"
  },
  {
    id: "m25", count: 1, source: "الترمذي وأحمد",
    arabic: "اللَّهُمَّ أَنْتَ رَبُّنَا لَا إِلَهَ إِلَّا أَنْتَ، عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ"
  },
  {
    id: "m26", count: 3, source: "أحمد والبيهقي",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ"
  },
  {
    id: "m27", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ، وَأَنْتَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "m28", count: 1, source: "ابن السني وأبو داود",
    arabic: "اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ"
  },
  {
    id: "m29", count: 1, source: "أبو داود",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ"
  },
  {
    id: "m30", count: 1, source: "الترمذي",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ"
  },
  {
    id: "m31", count: 1, source: "السنة",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ"
  },
];

// ─── Evening Adhkar Data ─────────────────────────────────────────────────────

const EVENING_ADHKAR: AdhkarItem[] = [
  {
    id: "e1", count: 1, source: "سورة البقرة: ٢٥٥", isQuran: true, surah: 2,
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    audioHint: "آية الكرسي"
  },
  {
    id: "e2", count: 3, source: "سورة الإخلاص", isQuran: true, surah: 112,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
    audioHint: "سورة الإخلاص"
  },
  {
    id: "e3", count: 3, source: "سورة الفلق", isQuran: true, surah: 113,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    audioHint: "سورة الفلق"
  },
  {
    id: "e4", count: 3, source: "سورة الناس", isQuran: true, surah: 114,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
    audioHint: "سورة الناس"
  },
  {
    id: "e5", count: 1, source: "أبو داود والترمذي",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا"
  },
  {
    id: "e6", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ"
  },
  {
    id: "e7", count: 1, source: "البخاري — سيد الاستغفار",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ"
  },
  {
    id: "e8", count: 3, source: "أبو داود والترمذي",
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا"
  },
  {
    id: "e9", count: 4, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ"
  },
  {
    id: "e10", count: 1, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ"
  },
  {
    id: "e11", count: 7, source: "أبو داود وابن ماجه",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ"
  },
  {
    id: "e12", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ"
  },
  {
    id: "e13", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ"
  },
  {
    id: "e14", count: 3, source: "أبو داود وابن ماجه",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ"
  },
  {
    id: "e15", count: 1, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي"
  },
  {
    id: "e16", count: 3, source: "أبو داود والترمذي",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ وَالْجُذَامِ وَمِنْ سَيِّئِ الْأَسْقَامِ"
  },
  {
    id: "e17", count: 10, source: "الترمذي والنسائي",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ"
  },
  {
    id: "e18", count: 100, source: "البخاري ومسلم",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
  },
  {
    id: "e19", count: 33, source: "مسلم",
    arabic: "سُبْحَانَ اللَّهِ"
  },
  {
    id: "e20", count: 33, source: "مسلم",
    arabic: "الْحَمْدُ لِلَّهِ"
  },
  {
    id: "e21", count: 34, source: "مسلم",
    arabic: "اللَّهُ أَكْبَرُ"
  },
  {
    id: "e22", count: 10, source: "أبو داود والنسائي",
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ"
  },
  {
    id: "e23", count: 3, source: "أبو داود والترمذي",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ"
  },
  {
    id: "e24", count: 1, source: "ابن ماجه والنسائي",
    arabic: "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا لَكَ مَمَاتُهَا وَمَحْيَاهَا إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا"
  },
  {
    id: "e25", count: 1, source: "الطبراني",
    arabic: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ"
  },
  {
    id: "e26", count: 3, source: "أحمد والبيهقي",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ"
  },
  {
    id: "e27", count: 1, source: "الترمذي",
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ"
  },
  {
    id: "e28", count: 1, source: "مسلم",
    arabic: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ وَنَبِيِّكَ الَّذِي أَرْسَلْتَ"
  },
  {
    id: "e29", count: 1, source: "الحاكم وابن حبان",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّيْطَانِ الرَّجِيمِ وَمِنْ كُلِّ شَيْطَانٍ مَارِدٍ"
  },
  {
    id: "e30", count: 1, source: "سورة المؤمنون: ١١٥-١١٨", isQuran: true, surah: 23,
    arabic: "أَفَحَسِبْتُمْ أَنَّمَا خَلَقْنَاكُمْ عَبَثًا وَأَنَّكُمْ إِلَيْنَا لَا تُرْجَعُونَ ۝ فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ ۝ لَا إِلَٰهَ إِلَّا هُوَ رَبُّ الْعَرْشِ الْكَرِيمِ",
    audioHint: "سورة المؤمنون"
  },
  {
    id: "e31", count: 1, source: "السنة",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ"
  },
];

// ─── Quran Audio Fetcher ─────────────────────────────────────────────────────

async function fetchQuranAudio(surah: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`
    );
    if (!res.ok) return null;
    const data = await res.json() as { data: { ayahs: { audio: string }[] } };
    return data.data.ayahs[0]?.audio ?? null;
  } catch { return null; }
}

// ─── Single Adhkar Item ──────────────────────────────────────────────────────

function AdhkarItemCard({
  item, index, total, done, current, onTap, audioEnabled,
}: {
  item: AdhkarItem;
  index: number;
  total: number;
  done: boolean;
  current: boolean;
  onTap: (id: string) => void;
  audioEnabled: boolean;
}) {
  const [count, setCount] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completed = count >= item.count;
  const prevDoneRef = useRef(done);

  useEffect(() => {
    if (!prevDoneRef.current && done) setCount(0);
    prevDoneRef.current = done;
  }, [done]);

  const handleTap = () => {
    if (done) return;
    const next = Math.min(count + 1, item.count);
    setCount(next);
    if (next >= item.count) onTap(item.id);
  };

  const handleAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isQuran || !item.surah) return;
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (!audioUrl) {
      setAudioLoading(true);
      const url = await fetchQuranAudio(item.surah);
      setAudioLoading(false);
      if (!url) return;
      setAudioUrl(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } else {
      if (!audioRef.current) audioRef.current = new Audio(audioUrl);
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setPlaying(true);
    }
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const progressPct = item.count === 1 ? (count > 0 ? 100 : 0) : Math.min((count / item.count) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      className="relative flex gap-3"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0"
          animate={done
            ? { backgroundColor: "#10b981", scale: [1, 1.15, 1] }
            : current
              ? { backgroundColor: "#f59e0b", scale: [1, 1.08, 1] }
              : { backgroundColor: "rgba(255,255,255,0.12)", scale: 1 }
          }
          transition={{ duration: 0.4 }}
          style={{ border: done ? "2px solid #6ee7b7" : current ? "2px solid #fcd34d" : "2px solid rgba(255,255,255,0.2)" }}
        >
          {done
            ? <CheckCircle size={14} className="text-white" />
            : <span className="text-[10px] font-bold text-white/80">{index + 1}</span>
          }
        </motion.div>
        {index < total - 1 && (
          <div className="flex-1 w-[2px] min-h-[12px] mt-1 rounded-full"
            style={{ background: done ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)" }} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 mb-3">
        <motion.button
          className="w-full text-right rounded-2xl p-4 select-none transition-all"
          style={{
            background: done
              ? "rgba(16,185,129,0.12)"
              : current
                ? "rgba(245,158,11,0.12)"
                : "rgba(255,255,255,0.06)",
            border: done
              ? "1.5px solid rgba(16,185,129,0.35)"
              : current
                ? "1.5px solid rgba(245,158,11,0.35)"
                : "1.5px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            opacity: (!done && !current) ? 0.65 : 1,
            cursor: done ? "default" : current ? "pointer" : "not-allowed",
          }}
          onClick={current ? handleTap : undefined}
          whileTap={current ? { scale: 0.98 } : {}}
          disabled={!current && !done}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: done ? "rgba(16,185,129,0.2)" : current ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)",
                color: done ? "#6ee7b7" : current ? "#fcd34d" : "rgba(255,255,255,0.5)",
              }}>
              {item.source}
            </span>
            <div className="flex items-center gap-1.5">
              {item.isQuran && audioEnabled && (
                <button
                  onClick={handleAudio}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.3)" }}
                >
                  {audioLoading
                    ? <Loader2 size={12} className="animate-spin text-blue-300" />
                    : playing
                      ? <VolumeX size={12} className="text-blue-300" />
                      : <Volume2 size={12} className="text-blue-300" />
                  }
                </button>
              )}
              <span className="text-[11px] font-bold"
                style={{ color: done ? "#6ee7b7" : current ? "#fcd34d" : "rgba(255,255,255,0.4)" }}>
                ×{item.count}
              </span>
            </div>
          </div>

          {/* Arabic text */}
          <p className="text-[15px] leading-loose font-amiri text-right"
            dir="rtl"
            style={{ color: done ? "rgba(255,255,255,0.75)" : current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)" }}>
            {item.arabic.length > 200 ? item.arabic.slice(0, 200) + "..." : item.arabic}
          </p>

          {/* Progress bar + counter (only for current) */}
          {current && !done && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to left, #f59e0b, #fcd34d)", width: `${progressPct}%` }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10px] text-white/40">اضغط على البطاقة للعد</span>
                <span className="text-[12px] font-bold" style={{ color: "#fcd34d" }}>
                  {count} / {item.count}
                </span>
              </div>
            </div>
          )}
          {done && (
            <div className="mt-2 flex items-center gap-1.5">
              <CheckCircle size={13} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">مكتمل</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Celebration Screen ──────────────────────────────────────────────────────

function CelebrationScreen({ type, onClose }: { type: AdhkarType; onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
      style={{
        background: "linear-gradient(160deg, rgba(0,30,20,0.97) 0%, rgba(0,20,40,0.97) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Stars */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${5 + Math.random() * 90}%`,
            fontSize: 8 + Math.random() * 14,
          }}
          animate={{ scale: [0, 1.3, 0.8, 1], opacity: [0, 1, 0.7, 1] }}
          transition={{ delay: i * 0.08, duration: 0.6 }}
        >
          ✦
        </motion.div>
      ))}

      <motion.div
        className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 60px rgba(16,185,129,0.5)" }}
        animate={{ scale: [0.6, 1.1, 1] }}
        transition={{ duration: 0.7, ease: "backOut" }}
      >
        <Award size={54} className="text-white" />
      </motion.div>

      <motion.h2
        className="text-3xl font-bold text-white mb-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        بارك الله فيك 🌙
      </motion.h2>

      <motion.p
        className="text-center text-white/70 text-base leading-relaxed mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        {type === "morning"
          ? "أتممت أذكار الصباح كاملةً"
          : "أتممت أذكار المساء كاملةً"}
      </motion.p>

      <motion.p
        className="text-center text-emerald-300/80 text-sm leading-relaxed mb-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        dir="rtl"
      >
        "مَن قَالَهَا حِينَ يُصْبِحُ وَحِينَ يُمْسِي كَانَ حَقًّا عَلَى اللَّهِ أَنْ يُرْضِيَهُ يَوْمَ الْقِيَامَةِ"
      </motion.p>

      <motion.button
        className="px-10 py-3.5 rounded-2xl font-bold text-base text-white"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 24px rgba(16,185,129,0.4)" }}
        onClick={onClose}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        whileTap={{ scale: 0.96 }}
      >
        ✓ إغلاق
      </motion.button>
    </motion.div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface AdhkarModalProps {
  visible: boolean;
  type: AdhkarType;
  onClose: () => void;
}

export function AdhkarModal({ visible, type, onClose }: AdhkarModalProps) {
  const items = type === "morning" ? MORNING_ADHKAR : EVENING_ADHKAR;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [celebrated, setCelebrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIndex = items.findIndex((item) => !completedIds.has(item.id));
  const allDone = currentIndex === -1 && completedIds.size > 0;

  const handleItemDone = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Scroll to next item
    setTimeout(() => {
      const cards = scrollRef.current?.querySelectorAll("[data-adhkar-card]");
      const nextCard = cards?.[currentIndex + 1] as HTMLElement | undefined;
      nextCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }, [currentIndex]);

  useEffect(() => {
    if (allDone && !celebrated) {
      setTimeout(() => setCelebrated(true), 400);
    }
  }, [allDone, celebrated]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setCompletedIds(new Set());
      setCelebrated(false);
    }
  }, [visible]);

  const isMorning = type === "morning";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: isMorning
              ? "linear-gradient(175deg, #0a1628 0%, #0d2340 25%, #0a1e2e 55%, #081428 100%)"
              : "linear-gradient(175deg, #0a0a1a 0%, #0d1030 25%, #0a0a28 55%, #050514 100%)",
          }}
        >
          {/* Islamic geometric background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/images/islamic-pattern-bg.png')",
              backgroundSize: "200px 200px",
              backgroundRepeat: "repeat",
              opacity: 0.06,
              mixBlendMode: "screen",
            }}
          />

          {/* Glow spots */}
          <div className="absolute pointer-events-none inset-0 overflow-hidden">
            <motion.div
              className="absolute rounded-full blur-[80px]"
              style={{
                width: 280, height: 280,
                top: -60, right: -60,
                background: isMorning ? "rgba(251,191,36,0.12)" : "rgba(99,102,241,0.12)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full blur-[100px]"
              style={{
                width: 240, height: 240,
                bottom: 0, left: -40,
                background: isMorning ? "rgba(16,185,129,0.08)" : "rgba(139,92,246,0.08)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>

          {/* Stars scatter */}
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none text-white/20"
              style={{ top: `${5 + (i * 5.2) % 88}%`, left: `${3 + (i * 7.3) % 94}%`, fontSize: 6 + (i % 4) * 3 }}
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.3 }}
            >
              ✦
            </motion.div>
          ))}

          {/* Header */}
          <motion.div
            className="relative z-10 flex items-center justify-between px-5 pt-safe-top py-4 flex-shrink-0"
            style={{
              paddingTop: "max(env(safe-area-inset-top), 16px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              background: "rgba(0,0,0,0.3)",
            }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <X size={17} className="text-white/80" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                {isMorning
                  ? <Sun size={18} className="text-amber-300" />
                  : <Moon size={18} className="text-indigo-300" />
                }
                <h1 className="text-base font-bold text-white">
                  {isMorning ? "أذكار الصباح" : "أذكار المساء"}
                </h1>
              </div>
              <p className="text-[11px] text-white/50">
                {completedIds.size} / {items.length} مكتمل
              </p>
            </div>

            <button
              onClick={() => setAudioEnabled((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: audioEnabled ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${audioEnabled ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              {audioEnabled
                ? <Volume2 size={16} className="text-blue-300" />
                : <VolumeX size={16} className="text-white/40" />
              }
            </button>
          </motion.div>

          {/* Progress bar */}
          <div className="relative z-10 h-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full"
              style={{
                background: isMorning
                  ? "linear-gradient(to left, #f59e0b, #fcd34d)"
                  : "linear-gradient(to left, #6366f1, #a78bfa)",
                width: `${(completedIds.size / items.length) * 100}%`,
              }}
              animate={{ width: `${(completedIds.size / items.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* Content */}
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-8"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Intro card */}
            <motion.div
              className="mb-5 rounded-2xl p-4 text-center"
              style={{
                background: isMorning ? "rgba(245,158,11,0.1)" : "rgba(99,102,241,0.1)",
                border: `1px solid ${isMorning ? "rgba(245,158,11,0.2)" : "rgba(99,102,241,0.2)"}`,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <Star size={14} style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }} />
                <span className="text-sm font-bold" style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }}>
                  {isMorning ? "أذكار الصباح كاملةً" : "أذكار المساء كاملةً"}
                </span>
                <Star size={14} style={{ color: isMorning ? "#fcd34d" : "#a78bfa" }} />
              </div>
              <p className="text-[11px] text-white/50">
                اضغط على البطاقة المضاءة لعد التسبيح • اضغط على 🔊 لسماع الآيات القرآنية
              </p>
            </motion.div>

            {/* Items */}
            {items.map((item, index) => (
              <div key={item.id} data-adhkar-card>
                <AdhkarItemCard
                  item={item}
                  index={index}
                  total={items.length}
                  done={completedIds.has(item.id)}
                  current={currentIndex === index}
                  onTap={handleItemDone}
                  audioEnabled={audioEnabled}
                />
              </div>
            ))}

            {/* Quick complete nav */}
            {!allDone && currentIndex >= 0 && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-4 mb-4 opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1 }}
              >
                <ChevronRight size={14} className="text-white/50" />
                <span className="text-[11px] text-white/50">
                  البند الحالي: {currentIndex + 1} من {items.length}
                </span>
              </motion.div>
            )}
          </div>

          {/* Celebration overlay */}
          <AnimatePresence>
            {celebrated && (
              <CelebrationScreen type={type} onClose={onClose} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
