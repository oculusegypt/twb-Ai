import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

interface Dua {
  id: number;
  title: string;
  arabic: string;
  transliteration?: string;
  source: string;
  category: string;
}

const DUAS: Dua[] = [
  {
    id: 1,
    title: "دعاء التوبة الأعظم",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    source: "سيد الاستغفار — رواه البخاري",
    category: "التوبة",
  },
  {
    id: 2,
    title: "الاستغفار",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    source: "رواه الترمذي وأبو داود",
    category: "التوبة",
  },
  {
    id: 3,
    title: "دعاء سيدنا آدم عليه السلام",
    arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    source: "سورة الأعراف — الآية 23",
    category: "التوبة",
  },
  {
    id: 4,
    title: "دعاء سيدنا يونس عليه السلام",
    arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    source: "سورة الأنبياء — الآية 87",
    category: "التوبة",
  },
  {
    id: 5,
    title: "طلب المغفرة والرحمة",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ",
    source: "رواه أبو داود والترمذي",
    category: "المغفرة",
  },
  {
    id: 6,
    title: "دعاء الثبات والعفو",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    source: "رواه الترمذي وابن ماجه",
    category: "العفو",
  },
  {
    id: 7,
    title: "دعاء الخروج من المعصية",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
    source: "رواه البخاري",
    category: "الاستعاذة",
  },
  {
    id: 8,
    title: "دعاء تفريج الكرب",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    source: "رواه البخاري ومسلم",
    category: "الكرب",
  },
  {
    id: 9,
    title: "دعاء التحصّن من الشيطان",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّيْطَانِ الرَّجِيمِ، وَمِنْ هَمَزَاتِهِ وَنَفَخَاتِهِ وَنَفَثَاتِهِ",
    source: "رواه أبو داود وابن ماجه",
    category: "الاستعاذة",
  },
  {
    id: 10,
    title: "دعاء قبول التوبة",
    arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ",
    source: "سورة البقرة — الآيتان 127-128",
    category: "التوبة",
  },
  {
    id: 11,
    title: "دعاء الإنابة إلى الله",
    arabic: "اللَّهُمَّ لَكَ أَسْلَمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَإِلَيْكَ أَنَبْتُ وَبِكَ خَاصَمْتُ، اللَّهُمَّ إِنِّي أَعُوذُ بِعِزَّتِكَ لَا إِلَهَ إِلَّا أَنْتَ أَنْ تُضِلَّنِي",
    source: "رواه البخاري ومسلم",
    category: "التوبة",
  },
  {
    id: 12,
    title: "دعاء طلب الهداية والثبات",
    arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
    source: "رواه الترمذي",
    category: "الثبات",
  },
];

const CATEGORIES = ["الكل", "التوبة", "المغفرة", "العفو", "الاستعاذة", "الكرب", "الثبات"];

const CATEGORY_COLORS: Record<string, string> = {
  التوبة: "#2E7D52",
  المغفرة: "#4A90B8",
  العفو: "#8E5CA8",
  الاستعاذة: "#C0392B",
  الكرب: "#E67E22",
  الثبات: "#C8963E",
  الكل: "#7F8C8D",
};

export default function DuasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = selectedCategory === "الكل"
    ? DUAS
    : DUAS.filter(d => d.category === selectedCategory);

  const handleCopy = async (dua: Dua) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(dua.arabic);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-right" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          أدعية التوبة
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === selectedCategory;
          const color = CATEGORY_COLORS[cat] ?? C.primary;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat);
              }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? color : C.card,
                  borderColor: active ? color : C.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: active ? "#fff" : C.textMuted, fontFamily: "Cairo_600SemiBold" },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
      >
        {filtered.map((dua) => {
          const color = CATEGORY_COLORS[dua.category] ?? C.primary;
          const copied = copiedId === dua.id;
          return (
            <View key={dua.id} style={[styles.duaCard, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.categoryBadgeText, { color, fontFamily: "Cairo_600SemiBold" }]}>
                    {dua.category}
                  </Text>
                </View>
                <Text style={[styles.duaTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                  {dua.title}
                </Text>
              </View>

              {/* Arabic Text */}
              <Text style={[styles.duaArabic, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                {dua.arabic}
              </Text>

              {/* Source & Copy */}
              <View style={styles.cardFooter}>
                <View style={styles.sourceRow}>
                  <Feather name="book" size={12} color={C.textMuted} />
                  <Text style={[styles.sourceText, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    {dua.source}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCopy(dua)}
                  style={[styles.copyBtn, { backgroundColor: copied ? C.success + "22" : C.border + "80" }]}
                >
                  <Feather name={copied ? "check" : "copy"} size={14} color={copied ? C.success : C.textMuted} />
                  <Text style={[styles.copyText, { color: copied ? C.success : C.textMuted, fontFamily: "Cairo_600SemiBold" }]}>
                    {copied ? "تم النسخ" : "نسخ"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20 },
  categoriesRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 13 },
  duaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    gap: 14,
  },
  cardHeader: { gap: 6 },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: { fontSize: 11 },
  duaTitle: { fontSize: 16 },
  duaArabic: {
    fontSize: 19,
    lineHeight: 38,
    textAlign: "right",
    writingDirection: "rtl",
  },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  sourceText: { fontSize: 12, flex: 1 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyText: { fontSize: 13 },
});
