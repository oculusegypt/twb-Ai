import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const EMERGENCY_VERSES = [
  {
    ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    ref: "الزمر: ٥٣",
  },
  {
    ar: "وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا",
    ref: "النساء: ١١٠",
  },
];

const ACTIONS = [
  { icon: "droplet", text: "اذهب وتوضأ الآن", bg: "#1A5C38" },
  { icon: "radio", text: "استمع إلى تلاوة القرآن", bg: "#7B4F12" },
  { icon: "phone", text: "اتصل بشخص صالح الآن", bg: "#2C4A7A" },
];

export default function SOSScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1A0A0A" : "#FFF5F5" }]}>
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
          <Animated.View style={[styles.sosCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Feather name="shield" size={40} color="#FFFFFF" />
          </Animated.View>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            لحظة.. قف!
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            قبل أي خطوة، تذكر عهدك مع الله
          </Text>
        </View>

        {/* Covenant Reminder */}
        <View style={[styles.covenantReminder, { backgroundColor: isDark ? "#2D1515" : "#FFF0F0", borderColor: "#E74C3C" }]}>
          <Feather name="heart" size={20} color="#E74C3C" />
          <Text style={[styles.covenantText, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            أنت عاهدت الله على التوبة النصوح
          </Text>
          <Text style={[styles.covenantSubText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            الشيطان يريدك أن تنسى. لا تنسَ.
          </Text>
        </View>

        {/* Immediate Actions */}
        <Text style={[styles.sectionLabel, { color: C.text, fontFamily: "Inter_700Bold" }]}>
          افعل الآن فوراً:
        </Text>
        {ACTIONS.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.actionCard, { backgroundColor: action.bg }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            activeOpacity={0.85}
          >
            <Feather name={action.icon as any} size={22} color="#FFFFFF" />
            <Text style={[styles.actionText, { fontFamily: "Inter_600SemiBold" }]}>
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Quran Verses */}
        <Text style={[styles.sectionLabel, { color: C.text, fontFamily: "Inter_700Bold", marginTop: 8 }]}>
          تذكر رحمة الله:
        </Text>
        {EMERGENCY_VERSES.map((v, idx) => (
          <View key={idx} style={[styles.verseCard, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.gold }]}>
            <Text style={[styles.verseAr, { color: C.text, fontFamily: "Inter_500Medium" }]}>
              {v.ar}
            </Text>
            <Text style={[styles.verseRef, { color: C.gold, fontFamily: "Inter_400Regular" }]}>
              — {v.ref}
            </Text>
          </View>
        ))}

        {/* Encouragement */}
        <View style={[styles.encourageBox, { backgroundColor: isDark ? C.surface : "#F4ECD8" }]}>
          <Text style={[styles.encourageTitle, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            تذكر دائماً:
          </Text>
          <Text style={[styles.encourageText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            إذا وقعت في الذنب ١٠٠ مرة، عُد إلى الله ١٠١ مرة. التوبة ليست حدثاً لمرة واحدة، بل أسلوب حياة. الله يفرح بتوبتك أشد الفرح.
          </Text>
        </View>

        {/* Back Safe button */}
        <TouchableOpacity
          style={[styles.safeButton, { backgroundColor: isDark ? C.surface : "#F0FBF4", borderColor: C.tint }]}
          onPress={async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
        >
          <Feather name="check" size={18} color={C.tint} />
          <Text style={[styles.safeText, { color: C.tint, fontFamily: "Inter_600SemiBold" }]}>
            أنا بخير الآن، شكراً لله
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 16 },
  header: { alignItems: "center", marginBottom: 24, gap: 12 },
  sosCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#C0392B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 28, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", maxWidth: 280 },
  covenantReminder: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  covenantText: { fontSize: 16, textAlign: "center" },
  covenantSubText: { fontSize: 13, textAlign: "center" },
  sectionLabel: { fontSize: 17, marginBottom: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionText: { color: "#FFFFFF", fontSize: 16, flex: 1 },
  verseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  verseAr: { fontSize: 17, textAlign: "center", lineHeight: 30 },
  verseRef: { textAlign: "center", fontSize: 13, marginTop: 8 },
  encourageBox: { borderRadius: 14, padding: 16, marginBottom: 20 },
  encourageTitle: { fontSize: 15, marginBottom: 8, textAlign: "center" },
  encourageText: { fontSize: 14, lineHeight: 24, textAlign: "center" },
  safeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  safeText: { fontSize: 16 },
});
