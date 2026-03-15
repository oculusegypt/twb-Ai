import React from "react";
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
import Colors from "@/constants/colors";

const SIGNS = [
  {
    num: 1,
    title: "انكسار القلب ورقته",
    desc: "أن تشعر دائماً بالخجل من الله والحياء منه، ويلازمك الشعور بالتقصير أمامه.",
    icon: "heart",
  },
  {
    num: 2,
    title: "استقباح الذنب",
    desc: "أن يصبح الذنب الذي كنت تعشقه مقززاً ومكروهاً في قلبك، فلا تقدر أن تتذكره إلا بالحزن.",
    icon: "shield",
  },
  {
    num: 3,
    title: "البديل الصالح",
    desc: "أن تجد في قلبك حلاوة للطاعة لم تكن تجدها من قبل، وتحب الذكر والصلاة والقرآن.",
    icon: "sun",
  },
  {
    num: 4,
    title: "الخوف من سوء الخاتمة",
    desc: "أن تظل حذراً من العودة للذنب خوفاً من أن تموت عليه، فيدفعك هذا للمداومة على الطاعة.",
    icon: "alert-circle",
  },
  {
    num: 5,
    title: "الإحساس بالمراقبة",
    desc: "أن تحس أن الله يراك في كل لحظة، فيجعلك تستحي منه وتتجنب كل ما يغضبه.",
    icon: "eye",
  },
];

export default function SignsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color={C.text} />
          <Text style={[styles.backText, { color: C.text, fontFamily: "Inter_500Medium" }]}>رجوع</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Feather name="star" size={36} color={C.gold} />
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            علامات قبول التوبة
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            يجدها التائب الصادق في نفسه إن شاء الله
          </Text>
        </View>

        {SIGNS.map((sign, idx) => (
          <View
            key={sign.num}
            style={[styles.signCard, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}
          >
            <View style={styles.signTop}>
              <View style={[styles.signNumBadge, { backgroundColor: C.gold }]}>
                <Text style={[styles.signNum, { fontFamily: "Inter_700Bold" }]}>{sign.num}</Text>
              </View>
              <View style={[styles.signIconCircle, { backgroundColor: isDark ? C.surface : "#F4ECD8" }]}>
                <Feather name={sign.icon as any} size={20} color={C.tint} />
              </View>
            </View>
            <Text style={[styles.signTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
              {sign.title}
            </Text>
            <Text style={[styles.signDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {sign.desc}
            </Text>
          </View>
        ))}

        <View style={[styles.noteBox, { backgroundColor: isDark ? C.surface : "#F4ECD8" }]}>
          <Text style={[styles.noteText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
            هذه العلامات ليست شرطاً للقبول، بل هي بشارات يمنحها الله للتائبين الصادقين
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  backText: { fontSize: 16 },
  header: { alignItems: "center", marginBottom: 24, gap: 10 },
  title: { fontSize: 26, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", maxWidth: 280 },
  signCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  signTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  signNumBadge: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  signNum: { color: "#FFFFFF", fontSize: 14 },
  signIconCircle: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  signTitle: { fontSize: 16, marginBottom: 6 },
  signDesc: { fontSize: 14, lineHeight: 22 },
  noteBox: { borderRadius: 14, padding: 16 },
  noteText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
