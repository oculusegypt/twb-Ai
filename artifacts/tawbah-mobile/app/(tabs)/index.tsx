import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
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
import { useApp } from "@/context/AppContext";

const VERSE = "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { progress, liveStats, isLoading } = useApp();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push("/sos");
  };

  const handleCovenant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/covenant");
  };

  const topPad = isWeb ? 67 : insets.top;

  const covenantSigned = progress?.covenantSigned ?? false;
  const streak = progress?.streakDays ?? 0;
  const day40 = progress?.day40Progress ?? 0;
  const phase = progress?.currentPhase ?? "البداية";
  const repentedToday = liveStats?.today.tawbah ?? 0;
  const totalRepented = liveStats?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.greeting, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              بسم الله الرحمن الرحيم
            </Text>
            <Text style={[styles.title, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
              دليل التوبة
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.sosBadge, { backgroundColor: C.danger }]}
              onPress={handleSOS}
            >
              <Feather name="alert-triangle" size={16} color="#fff" />
              <Text style={[styles.sosText, { fontFamily: "Cairo_700Bold" }]}>نجدة</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Verse Card */}
        <View style={[styles.verseCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.bismillah, { color: C.accent, fontFamily: "Cairo_700Bold" }]}>
            ﴿
          </Text>
          <Text style={[styles.verse, { color: C.text, fontFamily: "Cairo_400Regular" }]}>
            {VERSE}
          </Text>
          <Text style={[styles.verseRef, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
            — الزمر: ٥٣
          </Text>
        </View>

        {/* Live Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <MaterialCommunityIcons name="account-group" size={22} color={C.accent} />
            <Text style={[styles.statNumber, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
              {repentedToday.toLocaleString("ar-SA")}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              تابوا اليوم
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Feather name="trending-up" size={22} color={C.primary} />
            <Text style={[styles.statNumber, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              يوم استقامة
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Feather name="globe" size={22} color={C.primaryLight} />
            <Text style={[styles.statNumber, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
              {totalRepented > 999 ? `${Math.floor(totalRepented / 1000)}k` : totalRepented}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              إجمالي التوبة
            </Text>
          </View>
        </View>

        {/* Covenant / Journey Card */}
        {!covenantSigned ? (
          <Pressable
            style={({ pressed }) => [
              styles.covenantCard,
              { backgroundColor: C.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleCovenant}
          >
            <View style={styles.covenantInner}>
              <Feather name="edit-3" size={28} color="#fff" />
              <View style={{ flex: 1, marginHorizontal: 14 }}>
                <Text style={[styles.covenantTitle, { fontFamily: "Cairo_700Bold" }]}>
                  وقّع ميثاقك مع الله
                </Text>
                <Text style={[styles.covenantSub, { fontFamily: "Cairo_400Regular" }]}>
                  ابدأ رحلة التوبة الآن — كل لحظة فرصة جديدة
                </Text>
              </View>
              <Feather name="chevron-left" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.journeyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={styles.journeyHeader}>
              <Text style={[styles.journeyTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                رحلة الأربعين يوماً
              </Text>
              <View style={[styles.phaseBadge, { backgroundColor: C.accent + "22" }]}>
                <Text style={[styles.phaseText, { color: C.accent, fontFamily: "Cairo_600SemiBold" }]}>
                  {phase}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: C.primary,
                    width: `${Math.min((day40 / 40) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              اليوم {day40} من 40
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: "Cairo_600SemiBold" }]}>
          أدوات سريعة
        </Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="book-open"
            label="الأذكار"
            sublabel="صباحاً ومساءً"
            color={C.primary}
            bg={C.card}
            border={C.border}
            onPress={() => router.push("/dhikr")}
            C={C}
          />
          <QuickAction
            icon="map"
            label="رحلتي"
            sublabel="يومياتك"
            color={C.accent}
            bg={C.card}
            border={C.border}
            onPress={() => router.push("/journey")}
            C={C}
          />
          <QuickAction
            icon="pen-tool"
            label="مذكرتي"
            sublabel="سجّل يومك"
            color={C.primaryLight}
            bg={C.card}
            border={C.border}
            onPress={() => router.push("/more")}
            C={C}
          />
          <QuickAction
            icon="alert-triangle"
            label="نجدة"
            sublabel="لحظات الضعف"
            color={C.danger}
            bg={C.card}
            border={C.border}
            onPress={handleSOS}
            C={C}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon, label, sublabel, color, bg, border, onPress, C,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  onPress: () => void;
  C: typeof Colors.dark;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
        {label}
      </Text>
      <Text style={[styles.actionSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
        {sublabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  title: { fontSize: 26 },
  sosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sosText: { color: "#fff", fontSize: 13 },
  verseCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  bismillah: { fontSize: 22, marginBottom: 8 },
  verse: { fontSize: 15, textAlign: "center", lineHeight: 26, direction: "rtl" },
  verseRef: { fontSize: 12, marginTop: 10 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statNumber: { fontSize: 20 },
  statLabel: { fontSize: 11, textAlign: "center" },
  covenantCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  covenantInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  covenantTitle: { color: "#fff", fontSize: 16, marginBottom: 3 },
  covenantSub: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  journeyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  journeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  journeyTitle: { fontSize: 16 },
  phaseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  phaseText: { fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { fontSize: 12, textAlign: "right" },
  sectionTitle: {
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 20,
  },
  actionCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15, marginTop: 4 },
  actionSub: { fontSize: 12 },
});
