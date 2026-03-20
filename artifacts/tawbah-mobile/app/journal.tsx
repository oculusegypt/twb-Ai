import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { apiFetch } from "@/lib/api";

interface JournalEntry {
  id: number;
  content: string;
  mood: string;
  createdAt: string;
}

const MOOD_COLORS: Record<string, string> = {
  good: "#27AE60",
  struggling: "#E67E22",
  relapsed: "#C0392B",
  neutral: "#7F8C8D",
};

const MOOD_LABELS: Record<string, string> = {
  good: "بخير",
  struggling: "أعاني",
  relapsed: "انتكست",
  neutral: "عادي",
};

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await apiFetch<JournalEntry[]>("/journal");
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await apiFetch(`/journal/${id}`, { method: "DELETE" });
    } catch {
      loadEntries();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-right" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          مذكرتي
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: C.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/journal-entry");
          }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="pen-tool" size={48} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
            لا يوجد تسجيلات بعد
          </Text>
          <Text style={[styles.emptyDesc, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
            سجّل يومك وأحاسيسك الروحية
          </Text>
          <Pressable
            style={[styles.newEntryBtn, { backgroundColor: C.primary }]}
            onPress={() => router.push("/journal-entry")}
          >
            <Text style={[styles.newEntryText, { fontFamily: "Cairo_600SemiBold" }]}>
              تسجيل جديد
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={[styles.entryCard, { backgroundColor: C.card, borderColor: C.border }]}
            >
              <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: MOOD_COLORS[entry.mood] || C.textMuted },
                    ]}
                  />
                  <Text style={[styles.moodLabel, { color: MOOD_COLORS[entry.mood] || C.textMuted, fontFamily: "Cairo_600SemiBold" }]}>
                    {MOOD_LABELS[entry.mood] || entry.mood}
                  </Text>
                </View>
                <View style={styles.entryActions}>
                  <Text style={[styles.entryDate, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    {formatDate(entry.createdAt)}
                  </Text>
                  <Pressable onPress={() => handleDelete(entry.id)}>
                    <Feather name="trash-2" size={16} color={C.danger} />
                  </Pressable>
                </View>
              </View>
              <Text style={[styles.entryContent, { color: C.text, fontFamily: "Cairo_400Regular" }]}>
                {entry.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  newEntryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  newEntryText: { color: "#fff", fontSize: 15 },
  entryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  entryMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodLabel: { fontSize: 13 },
  entryActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  entryDate: { fontSize: 12 },
  entryContent: { fontSize: 15, lineHeight: 24 },
});
