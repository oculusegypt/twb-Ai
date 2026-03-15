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
import { LinearGradient } from "expo-linear-gradient";

export default function RelapseScreen() {
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
          <View style={[styles.iconCircle, { backgroundColor: isDark ? C.surface : "#EEF6F1", borderColor: C.tint }]}>
            <Feather name="refresh-cw" size={32} color={C.tint} />
          </View>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            التعامل مع الانتكاسات
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            لا تقنط من رحمة الله
          </Text>
        </View>

        {/* Main Verse */}
        <LinearGradient
          colors={isDark ? ["#1A3D28", "#0D1F15"] : ["#F0FBF4", "#FFFFFF"]}
          style={[styles.verseCard, { borderColor: C.tint }]}
        >
          <Text style={[styles.verseAr, { color: C.text, fontFamily: "Inter_500Medium" }]}>
            قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا
          </Text>
          <Text style={[styles.verseRef, { color: C.gold }]}>الزمر: ٥٣</Text>
        </LinearGradient>

        {/* The Trap */}
        <View style={[styles.trapCard, { backgroundColor: isDark ? "#2D1515" : "#FFF5F5", borderColor: "#E74C3C" }]}>
          <View style={styles.trapHeader}>
            <Feather name="alert-triangle" size={18} color="#E74C3C" />
            <Text style={[styles.trapTitle, { color: "#E74C3C", fontFamily: "Inter_600SemiBold" }]}>
              فخ الشيطان
            </Text>
          </View>
          <Text style={[styles.trapText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
            الشيطان سيأتيك من باب "الكمال أو اليأس"، سيقول لك: "أنت منافق، تبت ثم عدت. لا فائدة منك."
          </Text>
        </View>

        {/* The Truth */}
        <View style={[styles.truthCard, { backgroundColor: isDark ? "#1A3D28" : "#F0FBF4", borderColor: C.tint }]}>
          <View style={styles.truthHeader}>
            <Feather name="check-circle" size={18} color={C.tint} />
            <Text style={[styles.truthTitle, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
              الحقيقة
            </Text>
          </View>
          <Text style={[styles.truthText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
            التوبة هي "أسلوب حياة" وليست حدثاً لمرة واحدة. إن وقعت في الذنب ١٠٠ مرة، عُد إلى الله ١٠١ مرة. الله لا يمل حتى تملّوا.
          </Text>
        </View>

        {/* Steps after relapse */}
        <Text style={[styles.stepsTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
          ماذا تفعل بعد الانتكاسة؟
        </Text>

        {[
          { step: 1, text: "لا تيأس ولا تبرر - اعترف بالذنب فوراً" },
          { step: 2, text: "توضأ فوراً وصلِّ ركعتين بنية التوبة" },
          { step: 3, text: "قل سيد الاستغفار بخشوع تام" },
          { step: 4, text: "جدد النية وابدأ من جديد بعزم أكبر" },
          { step: 5, text: "تحقق من الثغرة التي أوقعتك وأغلقها" },
        ].map((item) => (
          <View key={item.step} style={[styles.stepCard, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
            <View style={[styles.stepNum, { backgroundColor: C.tint }]}>
              <Text style={[styles.stepNumText, { fontFamily: "Inter_700Bold" }]}>{item.step}</Text>
            </View>
            <Text style={[styles.stepText, { color: C.text, fontFamily: "Inter_500Medium" }]}>
              {item.text}
            </Text>
          </View>
        ))}

        {/* Bottom encouragement */}
        <View style={[styles.bottomCard, { backgroundColor: isDark ? C.surface : "#F4ECD8" }]}>
          <Text style={[styles.bottomTitle, { color: C.gold, fontFamily: "Inter_700Bold" }]}>
            تذكر دائماً
          </Text>
          <Text style={[styles.bottomText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
            التوبة تمسح الذنوب جميعها. وإن تبت توبة نصوحاً فإن الله يبدل سيئاتك حسنات بفضله ورحمته.
          </Text>
          <Text style={[styles.bottomVerse, { color: C.tint, fontFamily: "Inter_500Medium" }]}>
            فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ
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
  header: { alignItems: "center", marginBottom: 24, gap: 12 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  title: { fontSize: 26, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center" },
  verseCard: { borderRadius: 16, borderWidth: 1.5, padding: 20, marginBottom: 16 },
  verseAr: { fontSize: 17, textAlign: "center", lineHeight: 30 },
  verseRef: { textAlign: "center", fontSize: 13, marginTop: 10, fontFamily: "Inter_500Medium" },
  trapCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  trapHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  trapTitle: { fontSize: 15 },
  trapText: { fontSize: 14, lineHeight: 22 },
  truthCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  truthHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  truthTitle: { fontSize: 15 },
  truthText: { fontSize: 14, lineHeight: 22 },
  stepsTitle: { fontSize: 18, marginBottom: 14 },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepNum: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#FFFFFF", fontSize: 15 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
  bottomCard: { borderRadius: 16, padding: 20, marginTop: 8, gap: 10 },
  bottomTitle: { fontSize: 16, textAlign: "center" },
  bottomText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  bottomVerse: { fontSize: 16, textAlign: "center", lineHeight: 28 },
});
