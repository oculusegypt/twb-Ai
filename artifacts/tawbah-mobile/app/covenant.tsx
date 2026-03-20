import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const SIN_CATEGORIES = [
  { id: "النظر", label: "النظر المحرم", icon: "eye" as const },
  { id: "الاستمناء", label: "الاستمناء", icon: "slash" as const },
  { id: "الزنا", label: "الزنا", icon: "x-octagon" as const },
  { id: "المخدرات", label: "المخدرات والكحول", icon: "alert-circle" as const },
  { id: "الكذب", label: "الكذب والغش", icon: "message-circle" as const },
  { id: "أخرى", label: "ذنب آخر", icon: "more-horizontal" as const },
];

const COVENANT_TEXT = `أشهد أمام الله العلي القدير أنني أتوب إليه توبةً نصوحاً من ذنوبي، وأعزم على عدم العودة إليها، وأسأله المعونة والثبات.

«وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ»`;

export default function CovenantScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { signCovenant } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSign = !!selectedCategory && agreed;
  const topPad = isWeb ? 67 : insets.top;

  const handleSign = async () => {
    if (!canSign || !selectedCategory) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setLoading(true);
    try {
      await signCovenant(selectedCategory);
      router.back();
    } catch {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          الميثاق مع الله
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: C.primary + "18", borderColor: C.primary + "44" }]}>
          <Feather name="edit-3" size={24} color={C.primary} />
          <Text style={[styles.introText, { color: C.text, fontFamily: "Cairo_400Regular" }]}>
            هذا ميثاق بينك وبين الله. لا أحد يراه إلا أنت والله. كن صادقاً مع نفسك.
          </Text>
        </View>

        {/* Sin category */}
        <Text style={[styles.sectionLabel, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          ما الذنب الذي تريد التوبة منه؟
        </Text>
        <View style={styles.categoriesGrid}>
          {SIN_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryBtn,
                {
                  backgroundColor: selectedCategory === cat.id ? C.primary : C.card,
                  borderColor: selectedCategory === cat.id ? C.primary : C.border,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setSelectedCategory(cat.id);
              }}
            >
              <Feather
                name={cat.icon}
                size={18}
                color={selectedCategory === cat.id ? "#fff" : C.textSecondary}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  {
                    color: selectedCategory === cat.id ? "#fff" : C.text,
                    fontFamily: "Cairo_600SemiBold",
                  },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Covenant text */}
        <Text style={[styles.sectionLabel, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          نص الميثاق
        </Text>
        <View style={[styles.covenantBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.covenantText, { color: C.text, fontFamily: "Cairo_400Regular" }]}>
            {COVENANT_TEXT}
          </Text>
        </View>

        {/* Agreement */}
        <Pressable
          style={styles.agreeRow}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAgreed(!agreed);
          }}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreed ? C.primary : "transparent",
                borderColor: agreed ? C.primary : C.border,
              },
            ]}
          >
            {agreed && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={[styles.agreeText, { color: C.textSecondary, fontFamily: "Cairo_400Regular" }]}>
            أوافق على هذا الميثاق بيني وبين الله وأعزم على الوفاء به بإذن الله
          </Text>
        </Pressable>

        {/* Sign button */}
        <Pressable
          style={[
            styles.signBtn,
            { backgroundColor: canSign ? C.primary : C.border, opacity: loading ? 0.7 : 1 },
          ]}
          onPress={handleSign}
          disabled={!canSign || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="edit-3" size={18} color="#fff" />
              <Text style={[styles.signBtnText, { fontFamily: "Cairo_700Bold" }]}>
                {canSign ? "وقّع الميثاق" : "اختر الذنب ووافق أولاً"}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
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
  introCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  introText: { flex: 1, fontSize: 14, lineHeight: 22 },
  sectionLabel: { fontSize: 17, marginBottom: 12 },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 14 },
  covenantBox: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  covenantText: { fontSize: 15, lineHeight: 26, textAlign: "center" },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  agreeText: { flex: 1, fontSize: 14, lineHeight: 22 },
  signBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  signBtnText: { color: "#fff", fontSize: 16 },
});
