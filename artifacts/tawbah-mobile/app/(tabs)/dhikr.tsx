import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const DHIKR_ITEMS = [
  {
    key: "istighfar" as const,
    nameAr: "الاستغفار",
    textAr: "أَسْتَغْفِرُ اللهَ",
    target: 100,
    color: "#1A5C38",
    lightColor: "#2D8A57",
  },
  {
    key: "tasbih" as const,
    nameAr: "التسبيح",
    textAr: "سُبْحَانَ اللهِ",
    target: 33,
    color: "#7B4F12",
    lightColor: "#C9A84C",
  },
  {
    key: "sayyid" as const,
    nameAr: "سيد الاستغفار",
    textAr: "اللَّهُمَّ أَنتَ رَبِّي",
    target: 1,
    color: "#2C4A7A",
    lightColor: "#4A6FA5",
  },
];

export default function DhikrScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { dhikr, incrementDhikr, resetDhikr } = useApp();

  const handleTap = async (key: "istighfar" | "tasbih" | "sayyid") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementDhikr(key);
  };

  const handleReset = (key: "istighfar" | "tasbih" | "sayyid", nameAr: string) => {
    Alert.alert(
      "إعادة تعيين",
      `هل تريد إعادة تعيين ${nameAr}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة تعيين",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetDhikr(key);
          },
        },
      ]
    );
  };

  const SAYYID_FULL = `اللَّهُمَّ أَنتَ رَبِّي لَا إِلَهَ إِلَّا أَنتَ، خَلَقتَنِي وَأَنَا عَبدُكَ، وَأَنَا عَلَى عَهدِكَ وَوَعدِكَ مَا اسْتَطَعتُ، أَعُوذُ بِكَ مِن شَرِّ مَا صَنَعتُ، أَبُوءُ لَكَ بِنِعمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنبِي فَاغْفِر لِي؛ فَإِنَّهُ لَا يَغفِرُ الذُّنُوبَ إِلَّا أَنتَ`;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            عداد الذكر
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            اضغط للتسبيح والاستغفار
          </Text>
        </View>

        {DHIKR_ITEMS.map((item) => {
          const count = dhikr[item.key];
          const isComplete = count >= item.target;
          const pct = Math.min(count / item.target, 1);

          return (
            <View key={item.key} style={[styles.card, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.dhikrName, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                  {item.nameAr}
                </Text>
                <View style={styles.targetRow}>
                  <Text style={[styles.targetLabel, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    الهدف:
                  </Text>
                  <Text style={[styles.targetValue, { color: item.color, fontFamily: "Inter_600SemiBold" }]}>
                    {item.target}
                  </Text>
                </View>
              </View>

              {/* Dhikr text */}
              <Text style={[styles.dhikrTextAr, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                {item.key === "sayyid" ? "اللَّهُمَّ أَنتَ رَبِّي لَا إِلَهَ إِلَّا أَنتَ..." : item.textAr}
              </Text>

              {/* Counter */}
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handleTap(item.key)}
                activeOpacity={0.75}
              >
                <LinearGradient
                  colors={[item.color, item.lightColor]}
                  style={styles.counterGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isComplete && (
                    <Feather name="check-circle" size={24} color="rgba(255,255,255,0.8)" style={{ marginBottom: 4 }} />
                  )}
                  <Text style={[styles.countText, { fontFamily: "Inter_700Bold" }]}>
                    {count}
                  </Text>
                  <Text style={[styles.tapHint, { fontFamily: "Inter_400Regular" }]}>
                    {isComplete ? "مكتمل ✓" : "اضغط للعد"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Progress */}
              <View style={[styles.progressBar, { backgroundColor: isDark ? C.surface : "#EEE8D8" }]}>
                <View
                  style={[styles.progressFill, {
                    width: `${pct * 100}%`,
                    backgroundColor: isComplete ? C.success : item.color,
                  }]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.remainingText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  {isComplete ? "أحسنت!" : `المتبقي: ${item.target - count}`}
                </Text>
                <TouchableOpacity onPress={() => handleReset(item.key, item.nameAr)}>
                  <Feather name="rotate-ccw" size={16} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Sayyid al-Istighfar Full */}
        <View style={[styles.sayyidBox, { backgroundColor: isDark ? C.surface : "#F4ECD8", borderColor: C.gold }]}>
          <Text style={[styles.sayyidTitle, { color: C.gold, fontFamily: "Inter_600SemiBold" }]}>
            سيد الاستغفار كاملاً
          </Text>
          <Text style={[styles.sayyidText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
            {SAYYID_FULL}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dhikrName: { fontSize: 17 },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  targetLabel: { fontSize: 13 },
  targetValue: { fontSize: 15 },
  dhikrTextAr: { fontSize: 16, textAlign: "center", lineHeight: 28, marginVertical: 12 },
  counterButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  counterGradient: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  countText: { color: "#FFFFFF", fontSize: 56, lineHeight: 62 },
  tapHint: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  remainingText: { fontSize: 13 },
  sayyidBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 8 },
  sayyidTitle: { fontSize: 15, marginBottom: 10, textAlign: "center" },
  sayyidText: { fontSize: 16, lineHeight: 30, textAlign: "center" },
});
