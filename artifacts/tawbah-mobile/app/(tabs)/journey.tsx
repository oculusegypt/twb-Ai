import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { apiFetch, formatDate } from "@/lib/api";

interface Habit {
  id: number;
  name: string;
  nameAr: string;
  completed: boolean;
  category: string;
}

const PHASES = [
  { name: "اليقظة", days: "1-10", color: "#C8963E" },
  { name: "الانسلاخ", days: "11-20", color: "#2E7D52" },
  { name: "الاستقرار", days: "21-30", color: "#4A90B8" },
  { name: "الثبات", days: "31-40", color: "#8E5CA8" },
];

export default function JourneyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { progress, refreshProgress, isLoading } = useApp();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHabits = async () => {
    try {
      const data = await apiFetch<Habit[]>(`/habits?date=${formatDate()}`);
      setHabits(data);
    } catch {
      setHabits([]);
    } finally {
      setHabitsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchHabits(), refreshProgress()]);
    setRefreshing(false);
  };

  const toggleHabit = async (habit: Habit) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = !habit.completed;
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, completed: updated } : h))
    );
    try {
      await apiFetch("/habits", {
        method: "POST",
        body: JSON.stringify({ habitId: habit.id, completed: updated, date: formatDate() }),
      });
    } catch {
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, completed: !updated } : h))
      );
    }
  };

  const topPad = isWeb ? 67 : insets.top;
  const day40 = progress?.day40Progress ?? 0;
  const covenantSigned = progress?.covenantSigned ?? false;
  const streak = progress?.streakDays ?? 0;

  const currentPhaseIndex = Math.floor(day40 / 10);
  const currentPhase = PHASES[Math.min(currentPhaseIndex, 3)]!;

  const completedHabits = habits.filter((h) => h.completed).length;
  const habitsProgress = habits.length > 0 ? completedHabits / habits.length : 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
            رحلتي
          </Text>
          {streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: C.accent + "22", borderColor: C.accent + "44" }]}>
              <Feather name="zap" size={14} color={C.accent} />
              <Text style={[styles.streakText, { color: C.accent, fontFamily: "Cairo_700Bold" }]}>
                {streak} يوم
              </Text>
            </View>
          )}
        </View>

        {!covenantSigned ? (
          <View style={[styles.emptyState, { backgroundColor: C.card, borderColor: C.border }]}>
            <Feather name="map" size={40} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
              لم تبدأ رحلتك بعد
            </Text>
            <Text style={[styles.emptyDesc, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              وقّع الميثاق أولاً لتبدأ رحلة الأربعين يوماً
            </Text>
          </View>
        ) : (
          <>
            {/* 40 Day Progress */}
            <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                  رحلة الأربعين يوماً
                </Text>
                <Text style={[styles.dayCount, { color: C.accent, fontFamily: "Cairo_700Bold" }]}>
                  {day40}/40
                </Text>
              </View>

              {/* Phase dots */}
              <View style={styles.phaseDots}>
                {Array.from({ length: 40 }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i < day40 ? currentPhase.color : C.border,
                        opacity: i < day40 ? 1 : 0.4,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Phases */}
              <View style={styles.phasesRow}>
                {PHASES.map((p, idx) => (
                  <View
                    key={p.name}
                    style={[
                      styles.phaseItem,
                      idx <= currentPhaseIndex && { opacity: 1 },
                      idx > currentPhaseIndex && { opacity: 0.4 },
                    ]}
                  >
                    <View style={[styles.phaseColor, { backgroundColor: p.color }]} />
                    <Text style={[styles.phaseName, { color: C.textSecondary, fontFamily: "Cairo_400Regular" }]}>
                      {p.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Current Phase */}
            <View
              style={[
                styles.phaseCard,
                { backgroundColor: currentPhase.color + "18", borderColor: currentPhase.color + "44" },
              ]}
            >
              <View style={[styles.phaseIcon, { backgroundColor: currentPhase.color + "33" }]}>
                <Feather name="navigation" size={20} color={currentPhase.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phaseCurrent, { color: currentPhase.color, fontFamily: "Cairo_700Bold" }]}>
                  مرحلة {currentPhase.name}
                </Text>
                <Text style={[styles.phaseRange, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                  الأيام {currentPhase.days}
                </Text>
              </View>
            </View>

            {/* Today's Habits */}
            <View style={styles.habitsSection}>
              <View style={styles.habitsSectionHeader}>
                <Text style={[styles.sectionTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                  عادات اليوم
                </Text>
                {habits.length > 0 && (
                  <Text style={[styles.habitsCount, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    {completedHabits}/{habits.length}
                  </Text>
                )}
              </View>

              {habits.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <View style={[styles.habitsTrack, { backgroundColor: C.border }]}>
                    <View style={[styles.habitsFill, { backgroundColor: C.primary, width: `${habitsProgress * 100}%` }]} />
                  </View>
                </View>
              )}

              {habitsLoading ? (
                <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
              ) : habits.length === 0 ? (
                <View style={[styles.noHabits, { backgroundColor: C.card, borderColor: C.border }]}>
                  <Feather name="check-square" size={32} color={C.textMuted} />
                  <Text style={[styles.noHabitsText, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    لا عادات مضافة لهذا اليوم
                  </Text>
                </View>
              ) : (
                <View style={styles.habitsList}>
                  {habits.map((habit) => (
                    <Pressable
                      key={habit.id}
                      style={[
                        styles.habitItem,
                        {
                          backgroundColor: habit.completed ? C.primary + "18" : C.card,
                          borderColor: habit.completed ? C.primary + "44" : C.border,
                        },
                      ]}
                      onPress={() => toggleHabit(habit)}
                    >
                      <View
                        style={[
                          styles.habitCheck,
                          {
                            backgroundColor: habit.completed ? C.primary : "transparent",
                            borderColor: habit.completed ? C.primary : C.border,
                          },
                        ]}
                      >
                        {habit.completed && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <Text
                        style={[
                          styles.habitName,
                          {
                            color: habit.completed ? C.primary : C.text,
                            fontFamily: "Cairo_400Regular",
                            textDecorationLine: habit.completed ? "line-through" : "none",
                          },
                        ]}
                      >
                        {habit.nameAr || habit.name}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: C.border }]}>
                        <Text style={[styles.categoryText, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                          {habit.category}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: { fontSize: 13 },
  emptyState: {
    margin: 20,
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 18 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16 },
  dayCount: { fontSize: 22 },
  phaseDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  phasesRow: { flexDirection: "row", justifyContent: "space-between" },
  phaseItem: { alignItems: "center", gap: 4 },
  phaseColor: { width: 8, height: 8, borderRadius: 4 },
  phaseName: { fontSize: 11 },
  phaseCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  phaseIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  phaseCurrent: { fontSize: 16, marginBottom: 2 },
  phaseRange: { fontSize: 12 },
  habitsSection: { paddingHorizontal: 20, marginBottom: 20 },
  habitsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18 },
  habitsCount: { fontSize: 14 },
  habitsTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  habitsFill: { height: "100%", borderRadius: 2 },
  noHabits: {
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  noHabitsText: { fontSize: 14, textAlign: "center" },
  habitsList: { gap: 8 },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  habitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  habitName: { flex: 1, fontSize: 14 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 11 },
});
