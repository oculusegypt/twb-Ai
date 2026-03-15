import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { LinearGradient } from "expo-linear-gradient";

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { progress, habits, toggleHabit, loading } = useApp();

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;

  const isFirstDay = !progress?.firstDayTasksCompleted;

  if (!progress?.covenantSigned) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top + 20 }]}>
        <View style={styles.emptyState}>
          <Feather name="lock" size={48} color={C.textSecondary} />
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            ابدأ بتوقيع العهد أولاً
          </Text>
          <Text style={[styles.emptyDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            يجب أن توقع عهد التوبة قبل الوصول إلى قائمة المهام
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text, fontFamily: "Inter_700Bold" }]}>
            {isFirstDay ? "مهام اليوم الأول" : "مهام اليوم"}
          </Text>
          <Text style={[styles.subtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {isFirstDay
              ? "يجب إكمال جميع المهام للمتابعة"
              : `اليوم ${progress?.day40Progress ?? 1} من 40`}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressCard, { backgroundColor: isDark ? C.card : "#FFFFFF", borderColor: C.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
              التقدم اليومي
            </Text>
            <Text style={[styles.progressCount, { color: C.tint, fontFamily: "Inter_700Bold" }]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? C.surface : "#EEE8D8" }]}>
            <LinearGradient
              colors={["#1A5C38", "#2D8A57"]}
              style={[styles.progressFill, { width: `${progressPct * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          {progressPct === 1 && (
            <View style={styles.completedBadge}>
              <Feather name="check-circle" size={16} color={C.success} />
              <Text style={[styles.completedText, { color: C.success, fontFamily: "Inter_600SemiBold" }]}>
                أحسنت! أكملت كل مهام اليوم
              </Text>
            </View>
          )}
        </View>

        {/* Habits List */}
        <View style={styles.habitsList}>
          {loading ? (
            <ActivityIndicator color={C.tint} style={{ marginTop: 40 }} />
          ) : habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={C.textSecondary} />
              <Text style={[styles.emptyTitle, { color: C.textSecondary, fontFamily: "Inter_500Medium" }]}>
                لا توجد مهام اليوم
              </Text>
            </View>
          ) : (
            habits.map((habit, index) => (
              <TouchableOpacity
                key={habit.habitKey}
                style={[
                  styles.habitItem,
                  {
                    backgroundColor: habit.completed
                      ? isDark ? "#1A3D28" : "#F0FBF4"
                      : isDark ? C.card : "#FFFFFF",
                    borderColor: habit.completed ? C.success : C.border,
                  },
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(
                    habit.completed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
                  );
                  toggleHabit(habit.habitKey);
                }}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: habit.completed ? C.success : "transparent",
                    borderColor: habit.completed ? C.success : C.border,
                  }
                ]}>
                  {habit.completed && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[
                  styles.habitText,
                  {
                    color: habit.completed ? C.textSecondary : C.text,
                    textDecorationLine: habit.completed ? "line-through" : "none",
                    fontFamily: "Inter_500Medium",
                  }
                ]}>
                  {habit.habitNameAr}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Instructions */}
        {isFirstDay && (
          <View style={[styles.instructionBox, { backgroundColor: isDark ? C.surface : "#FFF8EC", borderColor: C.gold }]}>
            <Feather name="info" size={16} color={C.gold} />
            <Text style={[styles.instructionText, { color: C.text, fontFamily: "Inter_400Regular" }]}>
              أكمل جميع مهام هذا اليوم لتنتقل إلى خطة الـ ٤٠ يوماً
            </Text>
          </View>
        )}
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
  progressCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { fontSize: 15 },
  progressCount: { fontSize: 18 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  completedText: { fontSize: 13 },
  habitsList: { gap: 10 },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  habitText: { flex: 1, fontSize: 15, lineHeight: 22 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: 260 },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
  },
  instructionText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
