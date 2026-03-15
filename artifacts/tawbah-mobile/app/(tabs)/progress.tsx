import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const PHASES = [
  { phase: 1, title: "التهيئة والنية", desc: "العمل القلبي وإخلاص النية", icon: "heart" },
  { phase: 2, title: "أركان التوبة النصوح", desc: "الإقلاع، الندم، العزم على عدم العودة", icon: "shield" },
  { phase: 3, title: "الخطوات العملية", desc: "خطة التنفيذ الفوري", icon: "check-square" },
  { phase: 4, title: "ما بعد التوبة", desc: "استراتيجية الثبات والمزاحمة", icon: "trending-up" },
  { phase: 5, title: "علامات القبول", desc: "دلائل قبول التوبة", icon: "star" },
];

const SIN_LABELS: Record<string, string> = {
  khilwat: "ذنب الخلوات والنظر",
  mali: "ذنب مالي",
  huquq_nas: "ذنب يتعلق بحقوق الناس",
  taqsir_faraid: "تقصير في الفرائض",
  other: "أخرى",
};

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { progress } = useApp();

  if (!progress?.covenantSigned) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top + 20 }]}>
        <View style={styles.emptyState}>
          <Feather name="bar-chart-2" size={48} color={C.textSecondary} />
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            ابدأ رحلتك أولاً
          </Text>
          <Text style={[styles.emptyDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            وقّع عهد التوبة من الصفحة الرئيسية لتتبع تقدمك
          </Text>
        </View>
      </View>
    );
  }

  const dayPct = Math.min((progress.day40Progress ?? 0) / 40, 1);
  const currentPhase = progress.currentPhase ?? 1;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>تقدمك</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            رحلة التوبة النصوح
          </Text>
        </View>

        {/* 40 Day Progress */}
        <View style={[styles.card, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            خطة الـ ٤٠ يوماً
          </Text>
          <View style={styles.dayCircleRow}>
            <View style={styles.dayCircle}>
              <LinearGradient
                colors={["#1A5C38", "#2D8A57"]}
                style={styles.dayCircleGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.dayNumber, { fontFamily: "Inter_700Bold" }]}>
                  {progress.day40Progress ?? 0}
                </Text>
                <Text style={[styles.dayOf, { fontFamily: "Inter_400Regular" }]}>من ٤٠</Text>
              </LinearGradient>
            </View>
            <View style={styles.dayInfoCol}>
              <Text style={[styles.streakLabel, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                سلسلة الأيام
              </Text>
              <View style={styles.streakRow}>
                <Feather name="zap" size={18} color={C.gold} />
                <Text style={[styles.streakValue, { color: C.gold, fontFamily: "Inter_700Bold" }]}>
                  {progress.streakDays ?? 0} يوم
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? C.surface : "#EEE8D8" }]}>
            <LinearGradient
              colors={["#1A5C38", "#2D8A57"]}
              style={[styles.progressFill, { width: `${dayPct * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={[styles.progressPct, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {Math.round(dayPct * 100)}٪ مكتمل
          </Text>
        </View>

        {/* Sin Category */}
        <View style={[styles.card, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            نوع الذنب المختار
          </Text>
          <View style={[styles.categoryPill, { backgroundColor: isDark ? C.surface : "#F0FBF4", borderColor: C.tint }]}>
            <Feather name="shield" size={16} color={C.tint} />
            <Text style={[styles.categoryText, { color: C.tint, fontFamily: "Inter_500Medium" }]}>
              {SIN_LABELS[progress.sinCategory] ?? "أخرى"}
            </Text>
          </View>
          {progress.covenantDate && (
            <Text style={[styles.covenantDate, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              تاريخ العهد: {new Date(progress.covenantDate).toLocaleDateString("ar-SA")}
            </Text>
          )}
        </View>

        {/* Phases Roadmap */}
        <View style={[styles.card, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            خارطة الطريق
          </Text>
          {PHASES.map((p, idx) => {
            const isDone = currentPhase > p.phase;
            const isCurrent = currentPhase === p.phase;
            return (
              <View key={p.phase} style={styles.phaseRow}>
                <View style={styles.phaseConnector}>
                  <View style={[
                    styles.phaseCircle,
                    {
                      backgroundColor: isDone ? C.success : isCurrent ? C.tint : isDark ? C.surface : "#EEE8D8",
                      borderColor: isDone ? C.success : isCurrent ? C.tint : C.border,
                    }
                  ]}>
                    {isDone ? (
                      <Feather name="check" size={12} color="#FFFFFF" />
                    ) : (
                      <Feather name={p.icon as any} size={12} color={isCurrent ? "#FFFFFF" : C.textSecondary} />
                    )}
                  </View>
                  {idx < PHASES.length - 1 && (
                    <View style={[styles.phaseLine, { backgroundColor: isDone ? C.success : C.border }]} />
                  )}
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={[
                    styles.phaseTitle,
                    {
                      color: isDone ? C.success : isCurrent ? C.tint : C.text,
                      fontFamily: isCurrent ? "Inter_600SemiBold" : "Inter_500Medium",
                    }
                  ]}>
                    {p.title}
                  </Text>
                  <Text style={[styles.phaseDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
                    {p.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Encouragement */}
        <View style={[styles.encourageBox, { backgroundColor: isDark ? C.surface : "#F4ECD8" }]}>
          <Text style={[styles.encourageText, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ
          </Text>
          <Text style={[styles.encourageRef, { color: C.gold, fontFamily: "Inter_500Medium" }]}>
            — سورة الزمر: ٥٣
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, marginBottom: 14 },
  dayCircleRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 14 },
  dayCircle: { borderRadius: 50, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  dayCircleGrad: { width: 90, height: 90, alignItems: "center", justifyContent: "center" },
  dayNumber: { color: "#FFFFFF", fontSize: 36, lineHeight: 40 },
  dayOf: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  dayInfoCol: { gap: 6 },
  streakLabel: { fontSize: 13 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  streakValue: { fontSize: 22 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressPct: { fontSize: 13, textAlign: "right" },
  categoryPill: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: "flex-start", marginBottom: 8 },
  categoryText: { fontSize: 14 },
  covenantDate: { fontSize: 12, marginTop: 4 },
  phaseRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  phaseConnector: { alignItems: "center", gap: 0 },
  phaseCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  phaseLine: { width: 2, flex: 1, marginTop: 4, minHeight: 20 },
  phaseInfo: { flex: 1, paddingTop: 4 },
  phaseTitle: { fontSize: 14, marginBottom: 2 },
  phaseDesc: { fontSize: 12, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  encourageBox: { borderRadius: 14, padding: 16 },
  encourageText: { fontSize: 16, textAlign: "center", lineHeight: 28, marginBottom: 6 },
  encourageRef: { textAlign: "center", fontSize: 13 },
});
