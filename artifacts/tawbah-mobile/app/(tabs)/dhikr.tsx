import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { apiFetch, formatDate } from "@/lib/api";

interface DhikrType {
  id: string;
  label: string;
  arabic: string;
  target: number;
  color: string;
}

const DHIKR_TYPES: DhikrType[] = [
  { id: "istighfar", label: "الاستغفار", arabic: "أستغفر الله", target: 100, color: "#2E7D52" },
  { id: "tasbih", label: "التسبيح", arabic: "سبحان الله", target: 33, color: "#C8963E" },
  { id: "tahmid", label: "التحميد", arabic: "الحمد لله", target: 33, color: "#4A90B8" },
  { id: "takbir", label: "التكبير", arabic: "الله أكبر", target: 33, color: "#8E5CA8" },
  { id: "salawat", label: "الصلاة على النبي", arabic: "اللهم صل على محمد", target: 100, color: "#D4543E" },
];

export default function DhikrScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [selectedId, setSelectedId] = useState("istighfar");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const selected = DHIKR_TYPES.find((d) => d.id === selectedId)!;
  const currentCount = counts[selectedId] ?? 0;
  const progress = Math.min(currentCount / selected.target, 1);
  const isComplete = currentCount >= selected.target;

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await apiFetch<{ count: number }>(`/dhikr/count?date=${formatDate()}`);
        setTotalToday(data.count);
      } catch { /* offline */ }
    };
    fetchCount();
  }, []);

  const handleCount = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();

    setCounts((prev) => {
      const newCount = (prev[selectedId] ?? 0) + 1;
      if (newCount === selected.target && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return { ...prev, [selectedId]: newCount };
    });
    setTotalToday((t) => t + 1);

    apiFetch("/dhikr/increment", {
      method: "POST",
      body: JSON.stringify({ type: selectedId }),
    }).catch(() => {});
    apiFetch("/stats/event", {
      method: "POST",
      body: JSON.stringify({ type: "dhikr" }),
    }).catch(() => {});
  }, [selectedId, selected.target, scaleAnim]);

  const handleReset = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCounts((prev) => ({ ...prev, [selectedId]: 0 }));
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          الذكر
        </Text>
        <View style={[styles.totalBadge, { backgroundColor: C.card, borderColor: C.border }]}>
          <MaterialCommunityIcons name="counter" size={14} color={C.accent} />
          <Text style={[styles.totalText, { color: C.accent, fontFamily: "Cairo_600SemiBold" }]}>
            {totalToday} اليوم
          </Text>
        </View>
      </View>

      {/* Type selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={styles.typeRow}
      >
        {DHIKR_TYPES.map((d) => (
          <Pressable
            key={d.id}
            style={[
              styles.typeChip,
              {
                backgroundColor: selectedId === d.id ? d.color : C.card,
                borderColor: selectedId === d.id ? d.color : C.border,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setSelectedId(d.id);
            }}
          >
            <Text
              style={[
                styles.typeLabel,
                {
                  color: selectedId === d.id ? "#fff" : C.textSecondary,
                  fontFamily: "Cairo_600SemiBold",
                },
              ]}
            >
              {d.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Main Counter */}
      <View style={styles.counterSection}>
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: selected.color,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        {/* Tap button */}
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.btnWrapper]}>
          <Pressable
            style={[
              styles.counterBtn,
              {
                backgroundColor: isComplete ? selected.color : C.card,
                borderColor: selected.color,
                shadowColor: selected.color,
              },
            ]}
            onPress={handleCount}
          >
            <Text
              style={[
                styles.arabicText,
                { color: isComplete ? "#fff" : C.text, fontFamily: "Cairo_700Bold" },
              ]}
            >
              {selected.arabic}
            </Text>
            <Text
              style={[
                styles.countNumber,
                { color: isComplete ? "#fff" : selected.color, fontFamily: "Cairo_700Bold" },
              ]}
            >
              {currentCount}
            </Text>
            <Text
              style={[
                styles.targetText,
                { color: isComplete ? "rgba(255,255,255,0.7)" : C.textMuted, fontFamily: "Cairo_400Regular" },
              ]}
            >
              الهدف {selected.target}
            </Text>
          </Pressable>
        </Animated.View>

        {isComplete && (
          <View style={[styles.completeBadge, { backgroundColor: selected.color + "22" }]}>
            <Feather name="check-circle" size={16} color={selected.color} />
            <Text style={[styles.completeText, { color: selected.color, fontFamily: "Cairo_600SemiBold" }]}>
              ماشاء الله، أتممت الورد!
            </Text>
          </View>
        )}

        <Text style={[styles.tapHint, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
          اضغط على الزر للتسبيح
        </Text>

        <Pressable
          style={[styles.resetBtn, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={handleReset}
        >
          <Feather name="rotate-ccw" size={16} color={C.textMuted} />
          <Text style={[styles.resetLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
            إعادة الضبط
          </Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.summaryTitle, { color: C.textSecondary, fontFamily: "Cairo_600SemiBold" }]}>
          إجمالي الجلسة
        </Text>
        <View style={styles.summaryRow}>
          {DHIKR_TYPES.map((d) => (
            <View key={d.id} style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: d.color, fontFamily: "Cairo_700Bold" }]}>
                {counts[d.id] ?? 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                {d.label.length > 5 ? d.label.substring(0, 5) + ".." : d.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
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
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26 },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  totalText: { fontSize: 13 },
  typeRow: { paddingHorizontal: 20, gap: 8, alignItems: "center", paddingBottom: 4 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeLabel: { fontSize: 13 },
  counterSection: {
    alignItems: "center",
    paddingTop: 20,
    flex: 1,
    gap: 16,
  },
  progressTrack: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  btnWrapper: { alignItems: "center" },
  counterBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  arabicText: { fontSize: 15, textAlign: "center" },
  countNumber: { fontSize: 58 },
  targetText: { fontSize: 12 },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  completeText: { fontSize: 14 },
  tapHint: { fontSize: 13 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  resetLabel: { fontSize: 14 },
  summary: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: 12, marginBottom: 12, textTransform: "uppercase" },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center", gap: 3 },
  summaryNum: { fontSize: 20 },
  summaryLabel: { fontSize: 10 },
});
