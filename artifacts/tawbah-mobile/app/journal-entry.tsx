import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { apiFetch } from "@/lib/api";

const MOODS = [
  { id: "good", label: "بخير", icon: "smile" as const, color: "#27AE60" },
  { id: "neutral", label: "عادي", icon: "meh" as const, color: "#7F8C8D" },
  { id: "struggling", label: "أعاني", icon: "frown" as const, color: "#E67E22" },
  { id: "relapsed", label: "انتكست", icon: "alert-circle" as const, color: "#C0392B" },
];

export default function JournalEntryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await apiFetch("/journal", {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), mood }),
      });
      router.back();
    } catch {
      setLoading(false);
    }
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          تسجيل جديد
        </Text>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: content.trim() ? C.primary : C.border }]}
          onPress={handleSave}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.saveBtnText, { fontFamily: "Cairo_600SemiBold" }]}>حفظ</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood selector */}
        <Text style={[styles.label, { color: C.textSecondary, fontFamily: "Cairo_600SemiBold" }]}>
          كيف حالك اليوم؟
        </Text>
        <View style={styles.moodsRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m.id}
              style={[
                styles.moodBtn,
                {
                  backgroundColor: mood === m.id ? m.color + "22" : C.card,
                  borderColor: mood === m.id ? m.color : C.border,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setMood(m.id);
              }}
            >
              <Feather name={m.icon} size={20} color={mood === m.id ? m.color : C.textMuted} />
              <Text
                style={[
                  styles.moodLabel,
                  {
                    color: mood === m.id ? m.color : C.textMuted,
                    fontFamily: "Cairo_600SemiBold",
                  },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <Text style={[styles.label, { color: C.textSecondary, fontFamily: "Cairo_600SemiBold" }]}>
          ماذا في قلبك؟
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: C.card,
              borderColor: C.border,
              color: C.text,
              fontFamily: "Cairo_400Regular",
              textAlign: "right",
            },
          ]}
          placeholder="اكتب ما تشعر به، ما تتمناه، ما تخاف منه، ما تريد من الله..."
          placeholderTextColor={C.textMuted}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />
      </KeyboardAwareScrollView>
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
  headerTitle: { fontSize: 18 },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 14 },
  label: { fontSize: 14, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  moodsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  moodLabel: { fontSize: 12 },
  textInput: {
    minHeight: 200,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: "top",
  },
});
