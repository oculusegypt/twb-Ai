import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const QURAN_VERSE = "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ";
const VERSE_REF = "البقرة: ٢٢٢";

const SIN_CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: "khilwat", label: "ذنب الخلوات والنظر", icon: "eye-off" },
  { key: "mali", label: "ذنب مالي", icon: "dollar-sign" },
  { key: "huquq_nas", label: "ذنب يتعلق بحقوق الناس", icon: "users" },
  { key: "taqsir_faraid", label: "تقصير في الفرائض", icon: "book-open" },
  { key: "other", label: "أخرى", icon: "more-horizontal" },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { progress, loading } = useApp();

  const handleSOS = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push("/sos");
  };

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!progress?.covenantSigned) {
      router.push("/covenant");
    } else {
      router.push("/(tabs)/habits");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={isDark ? ["#0D1F15", "#1A5C38", "#0D1F15"] : ["#E8F5EE", "#FFFFFF", "#FDF8EE"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appSubtitle, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            رحلتك نحو النور
          </Text>
        </View>

        {/* Quran Verse Card */}
        <View style={[styles.verseCard, { backgroundColor: isDark ? Colors.dark.card : "#FFFFFF", borderColor: C.gold }]}>
          <View style={[styles.verseTopBar, { backgroundColor: C.gold }]} />
          <Text style={[styles.verseText, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
            {QURAN_VERSE}
          </Text>
          <Text style={[styles.verseRef, { color: C.gold, fontFamily: "Inter_500Medium" }]}>
            — {VERSE_REF}
          </Text>
        </View>

        {/* Status Card */}
        {progress?.covenantSigned ? (
          <View style={[styles.statusCard, { backgroundColor: isDark ? Colors.dark.surface : "#F0FBF4", borderColor: C.tint }]}>
            <View style={styles.statusRow}>
              <Feather name="check-circle" size={20} color={C.success} />
              <Text style={[styles.statusTitle, { color: C.success, fontFamily: "Inter_600SemiBold" }]}>
                أنت في رحلة التوبة
              </Text>
            </View>
            <Text style={[styles.statusDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              اليوم {progress.day40Progress} من 40 • سلسلة {progress.streakDays} يوم
            </Text>
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: isDark ? Colors.dark.surface : "#FFF8EC", borderColor: C.gold }]}>
            <View style={styles.statusRow}>
              <Feather name="heart" size={20} color={C.gold} />
              <Text style={[styles.statusTitle, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>
                ابدأ رحلة التوبة
              </Text>
            </View>
            <Text style={[styles.statusDesc, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              مجرد نيتك للتوبة هي اصطفاء من الله لك
            </Text>
          </View>
        )}

        {/* Main Action Button */}
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: C.tint }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDark ? [Colors.dark.tint, Colors.dark.tintLight] : ["#1A5C38", "#2D8A57"]}
            style={styles.mainButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.mainButtonText, { fontFamily: "Inter_700Bold" }]}>
              {progress?.covenantSigned ? "تابع رحلتك" : "أعاهد الله على التوبة"}
            </Text>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: isDark ? Colors.dark.card : "#FFFFFF", borderColor: C.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/signs"); }}
          >
            <Feather name="star" size={18} color={C.gold} />
            <Text style={[styles.quickLinkText, { color: C.text, fontFamily: "Inter_500Medium" }]}>علامات القبول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickLink, { backgroundColor: isDark ? Colors.dark.card : "#FFFFFF", borderColor: C.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/relapse"); }}
          >
            <Feather name="refresh-cw" size={18} color={C.tint} />
            <Text style={[styles.quickLinkText, { color: C.text, fontFamily: "Inter_500Medium" }]}>الانتكاسات</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={[styles.sosButton, { borderColor: C.sosRed }]} onPress={handleSOS} activeOpacity={0.8}>
          <View style={styles.sosInner}>
            <Feather name="alert-triangle" size={22} color={C.sosRed} />
            <Text style={[styles.sosText, { color: C.sosRed, fontFamily: "Inter_700Bold" }]}>
              زر الطوارئ
            </Text>
            <Text style={[styles.sosSubtext, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
              اضغط عند الشعور بالخطر
            </Text>
          </View>
        </TouchableOpacity>

        {/* Inspiring Quote */}
        <View style={[styles.quoteBox, { backgroundColor: isDark ? Colors.dark.surface : "#F4ECD8" }]}>
          <Text style={[styles.quoteText, { color: C.textSecondary, fontFamily: "Inter_400Regular" }]}>
            إذا وقعت في الذنب ١٠٠ مرة، عُد إلى الله ١٠١ مرة
          </Text>
          <Text style={[styles.quoteSource, { color: C.gold, fontFamily: "Inter_500Medium" }]}>
            — من هدي العلماء
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: { alignItems: "center", marginBottom: 24 },
  logoImage: { width: 100, height: 100, marginBottom: 8 },
  appName: { fontSize: 26, textAlign: "center", lineHeight: 38 },
  appSubtitle: { fontSize: 14, textAlign: "center", marginTop: 4 },
  verseCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verseTopBar: { height: 4, width: "100%" },
  verseText: { fontSize: 18, textAlign: "center", padding: 20, lineHeight: 32 },
  verseRef: { textAlign: "center", paddingBottom: 12, fontSize: 13 },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  statusTitle: { fontSize: 16 },
  statusDesc: { fontSize: 13, lineHeight: 20 },
  mainButton: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#1A5C38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  mainButtonText: { color: "#FFFFFF", fontSize: 18 },
  quickLinksRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickLink: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLinkText: { fontSize: 12, textAlign: "center" },
  sosButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 16,
    overflow: "hidden",
  },
  sosInner: { padding: 16, alignItems: "center", gap: 4 },
  sosText: { fontSize: 16 },
  sosSubtext: { fontSize: 12, textAlign: "center" },
  quoteBox: { borderRadius: 12, padding: 16 },
  quoteText: { fontSize: 14, textAlign: "center", lineHeight: 22, fontStyle: "italic" },
  quoteSource: { textAlign: "center", marginTop: 6, fontSize: 12 },
});
