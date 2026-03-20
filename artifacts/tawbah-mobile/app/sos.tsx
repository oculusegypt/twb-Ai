import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";

const EMERGENCY_STEPS = [
  {
    icon: "wind" as const,
    title: "توقف وتنفس",
    desc: "خذ 5 أنفاس عميقة. ابدأ الآن. شهيق... زفير...",
  },
  {
    icon: "map-pin" as const,
    title: "غيّر مكانك",
    desc: "انهض الآن وانتقل إلى غرفة أخرى أو اخرج من البيت",
  },
  {
    icon: "volume-2" as const,
    title: "أدِّ وضوءاً",
    desc: "قم إلى الماء فتوضأ. الماء يطفئ نار الشهوة",
  },
  {
    icon: "radio" as const,
    title: "اقرأ أو اسمع",
    desc: "افتح القرآن أو استمع لسورة البقرة الآن",
  },
  {
    icon: "message-circle" as const,
    title: "تواصل مع أخ",
    desc: "اتصل بصاحب ثقة أو أرسل له رسالة الآن",
  },
];

const DUAS = [
  "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
  "اللهم إني أعوذ بك من شر نفسي ومن شر الشيطان الرجيم",
  "رَبِّ إِنِّي ظَلَمْتُ نَفْسِي فَاغْفِرْ لِي",
  "اللهم أعني على نفسي وأعني على أمري",
];

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [step, setStep] = useState(0);
  const [duaIndex, setDuaIndex] = useState(0);
  const [survived, setSurvived] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const nextStep = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < EMERGENCY_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setSurvived(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      apiFetch("/stats/event", { method: "POST", body: JSON.stringify({ type: "tawbah" }) }).catch(() => {});
    }
  };

  const nextDua = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setDuaIndex((i) => (i + 1) % DUAS.length);
  };

  const topPad = isWeb ? 67 : insets.top;

  if (survived) {
    return (
      <View style={[styles.survivedContainer, { paddingTop: topPad }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <View style={styles.survivedContent}>
          <Animated.View style={[styles.successRing, { transform: [{ scale: pulseAnim }] }]}>
            <Feather name="shield" size={48} color="#fff" />
          </Animated.View>
          <Text style={[styles.survivedTitle, { fontFamily: "Cairo_700Bold" }]}>
            الحمد لله، نجوت!
          </Text>
          <Text style={[styles.survivedDesc, { fontFamily: "Cairo_400Regular" }]}>
            كل لحظة صمود هي انتصار. الله يراك ويحبك ويفرح بتوبتك
          </Text>
          <Text style={[styles.hadith, { fontFamily: "Cairo_400Regular" }]}>
            «لَلَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ مِنْ أَحَدِكُمْ»
          </Text>
          <Pressable
            style={styles.survivedBtn}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={[styles.survivedBtnText, { fontFamily: "Cairo_700Bold" }]}>
              العودة للتطبيق
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const current = EMERGENCY_STEPS[step]!;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Feather name="x" size={22} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 34 : insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert header */}
        <Animated.View style={[styles.alertBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Feather name="alert-triangle" size={20} color="#fff" />
          <Text style={[styles.alertText, { fontFamily: "Cairo_700Bold" }]}>وقف! اقرأ بتأنٍّ</Text>
        </Animated.View>

        {/* Step indicator */}
        <View style={styles.stepsRow}>
          {EMERGENCY_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                { backgroundColor: i <= step ? "#fff" : "rgba(255,255,255,0.25)" },
              ]}
            />
          ))}
        </View>

        {/* Current step */}
        <View style={styles.stepCard}>
          <View style={styles.stepIconWrap}>
            <Feather name={current.icon} size={32} color="#fff" />
          </View>
          <Text style={[styles.stepTitle, { fontFamily: "Cairo_700Bold" }]}>{current.title}</Text>
          <Text style={[styles.stepDesc, { fontFamily: "Cairo_400Regular" }]}>{current.desc}</Text>
        </View>

        {/* Dua */}
        <Pressable style={styles.duaCard} onPress={nextDua}>
          <Text style={[styles.duaLabel, { fontFamily: "Cairo_400Regular" }]}>ادعُ الآن:</Text>
          <Text style={[styles.duaText, { fontFamily: "Cairo_700Bold" }]}>{DUAS[duaIndex]}</Text>
          <Text style={[styles.duaTap, { fontFamily: "Cairo_400Regular" }]}>اضغط لدعاء آخر</Text>
        </Pressable>

        {/* Next step button */}
        <Pressable style={styles.nextBtn} onPress={nextStep}>
          <Text style={[styles.nextBtnText, { fontFamily: "Cairo_700Bold" }]}>
            {step < EMERGENCY_STEPS.length - 1 ? "فعلت هذا، التالي" : "تجاوزت الأزمة الحمد لله"}
          </Text>
          <Feather name="chevron-left" size={20} color="#1A5C38" />
        </Pressable>

        <Text style={[styles.reminder, { fontFamily: "Cairo_400Regular" }]}>
          «وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا»
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A2E24" },
  closeBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 24, alignItems: "center" },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#C0392B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 20,
    marginTop: 40,
  },
  alertText: { color: "#fff", fontSize: 15 },
  stepsRow: { flexDirection: "row", gap: 8, marginBottom: 30 },
  stepDot: { width: 24, height: 6, borderRadius: 3 },
  stepCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  stepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { color: "#fff", fontSize: 22, textAlign: "center" },
  stepDesc: { color: "rgba(255,255,255,0.75)", fontSize: 16, textAlign: "center", lineHeight: 26 },
  duaCard: {
    width: "100%",
    backgroundColor: "rgba(200,150,62,0.15)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(200,150,62,0.3)",
  },
  duaLabel: { color: "rgba(200,150,62,0.8)", fontSize: 12 },
  duaText: { color: "#EDF2EE", fontSize: 16, textAlign: "center", lineHeight: 28 },
  duaTap: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EDF2EE",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  nextBtnText: { color: "#1A5C38", fontSize: 16 },
  reminder: { color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" },
  survivedContainer: { flex: 1, backgroundColor: "#0A2A18", alignItems: "center", justifyContent: "center" },
  survivedContent: { alignItems: "center", padding: 32, gap: 16 },
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2E7D52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  survivedTitle: { color: "#EDF2EE", fontSize: 28 },
  survivedDesc: { color: "rgba(255,255,255,0.7)", fontSize: 16, textAlign: "center", lineHeight: 26 },
  hadith: { color: "rgba(200,150,62,0.8)", fontSize: 14, textAlign: "center", fontStyle: "italic" },
  survivedBtn: {
    backgroundColor: "#2E7D52",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  survivedBtnText: { color: "#fff", fontSize: 16 },
});
