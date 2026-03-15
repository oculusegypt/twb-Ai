import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const SIN_CATEGORIES = [
  { key: "khilwat", labelAr: "ذنب الخلوات والنظر", icon: "eye-off", desc: "ما يتعلق بالخلوة والبصر" },
  { key: "mali", labelAr: "ذنب مالي", icon: "dollar-sign", desc: "ما يتعلق بالأموال والمعاملات" },
  { key: "huquq_nas", labelAr: "ذنب يتعلق بحقوق الناس", icon: "users", desc: "ما تعلق بحق آدمي" },
  { key: "taqsir_faraid", labelAr: "تقصير في الفرائض", icon: "book-open", desc: "ترك أو تأخير واجب" },
  { key: "other", labelAr: "أخرى", icon: "more-horizontal", desc: "ذنوب متفرقة" },
];

export default function CovenantScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { signCovenant } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!selected) return;
    setSigning(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await signCovenant(selected);
    router.back();
    router.push("/(tabs)/habits");
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={C.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? C.surface : "#F0FBF4", borderColor: C.tint }]}>
            <Feather name="heart" size={32} color={C.tint} />
          </View>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            عهد التوبة النصوح
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            حدد نوع الذنب دون الإفصاح عن تفاصيله حفاظاً على سترك
          </Text>
        </View>

        {/* Verse */}
        <View style={[styles.verseCard, { backgroundColor: isDark ? C.card : "#FFF8EC", borderColor: C.gold }]}>
          <Text style={[styles.verseText, { color: C.text, fontFamily: "Inter_500Medium" }]}>
            رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ
          </Text>
          <Text style={[styles.verseRef, { color: C.gold, fontFamily: "Inter_400Regular" }]}>
            الأعراف: ٢٣
          </Text>
        </View>

        {/* Category Selection */}
        <Text style={[styles.sectionLabel, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
          اختر تصنيف الذنب
        </Text>

        {SIN_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryItem,
              {
                backgroundColor: selected === cat.key
                  ? isDark ? "#1A3D28" : "#F0FBF4"
                  : isDark ? C.card : "#FFFFFF",
                borderColor: selected === cat.key ? C.tint : C.border,
                borderWidth: selected === cat.key ? 2 : 1,
              }
            ]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelected(cat.key);
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.catIcon, { backgroundColor: selected === cat.key ? C.tint : isDark ? C.surface : "#F4ECD8" }]}>
              <Feather name={cat.icon as any} size={18} color={selected === cat.key ? "#FFFFFF" : C.text} />
            </View>
            <View style={styles.catInfo}>
              <Text style={[styles.catLabel, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                {cat.labelAr}
              </Text>
              <Text style={[styles.catDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {cat.desc}
              </Text>
            </View>
            {selected === cat.key && (
              <Feather name="check-circle" size={20} color={C.tint} />
            )}
          </TouchableOpacity>
        ))}

        {/* Covenant Button */}
        <TouchableOpacity
          style={[styles.covenantButton, { opacity: selected ? 1 : 0.5 }]}
          onPress={handleSign}
          disabled={!selected || signing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#1A5C38", "#2D8A57"]}
            style={styles.covenantGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="heart" size={20} color="#FFFFFF" />
            <Text style={[styles.covenantText, { fontFamily: "Inter_700Bold" }]}>
              أعاهد الله الآن على التوبة النصوح
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.privacyNote, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
          لا يتم الاطلاع على تفاصيل ذنبك — سرك بينك وبين ربك
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 16 },
  header: { alignItems: "center", marginBottom: 24, gap: 12 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  title: { fontSize: 24, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: 280 },
  verseCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  verseText: { fontSize: 16, textAlign: "center", lineHeight: 28 },
  verseRef: { textAlign: "center", fontSize: 13, marginTop: 8 },
  sectionLabel: { fontSize: 13, marginBottom: 10, textAlign: "right" },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  catIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 15, marginBottom: 2 },
  catDesc: { fontSize: 12, lineHeight: 18 },
  covenantButton: {
    borderRadius: 14,
    marginTop: 24,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#1A5C38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  covenantGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  covenantText: { color: "#FFFFFF", fontSize: 17 },
  privacyNote: { textAlign: "center", fontSize: 12, lineHeight: 18 },
});
