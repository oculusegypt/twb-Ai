import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel?: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { progress } = useApp();

  const topPad = isWeb ? 67 : insets.top;

  const menuGroups: MenuGroup[] = [
    {
      title: "طوارئ",
      items: [
        {
          icon: "alert-triangle",
          label: "زر النجدة",
          sublabel: "عند لحظات الضعف",
          color: C.danger,
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.push("/sos");
          },
        },
      ],
    },
    {
      title: "العبادات",
      items: [
        {
          icon: "book-open",
          label: "أوقات الصلاة",
          sublabel: "مواقيت الصلاة",
          color: C.primary,
          onPress: () => router.push("/prayer-times"),
        },
        {
          icon: "pen-tool",
          label: "مذكرتي",
          sublabel: "يومياتك الروحية",
          color: C.accent,
          onPress: () => router.push("/journal"),
        },
        {
          icon: "heart",
          label: "الأدعية المحفوظة",
          sublabel: "دعاء التوبة والاستغفار",
          color: C.primaryLight,
          onPress: () => router.push("/duas"),
        },
      ],
    },
    {
      title: "المجتمع",
      items: [
        {
          icon: "users",
          label: "الدعاء السري",
          sublabel: "ادعُ لإخوانك",
          color: "#4A90B8",
          onPress: () => router.push("/secret-dua"),
        },
        {
          icon: "globe",
          label: "دعاء الجماعة",
          sublabel: "ادعُ مع الجميع",
          color: "#8E5CA8",
          onPress: () => router.push("/community-duas"),
        },
      ],
    },
    {
      title: "الإعدادات",
      items: [
        {
          icon: "bell",
          label: "الإشعارات",
          sublabel: "تذكيرات العبادة",
          color: C.textSecondary,
          onPress: () => {
            Alert.alert("الإشعارات", "الإشعارات متاحة في تطبيق الويب");
          },
        },
        {
          icon: "info",
          label: "عن التطبيق",
          sublabel: "دليل التوبة النصوح",
          color: C.textMuted,
          onPress: () => {
            Alert.alert("دليل التوبة النصوح", "تطبيق إسلامي يساعدك على رحلة التوبة وتزكية النفس.\n\nالإصدار 1.0.0");
          },
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
            المزيد
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.avatar, { backgroundColor: C.primary + "33" }]}>
            <MaterialCommunityIcons name="account" size={32} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
              {progress?.covenantSigned ? "تائب لله" : "مسافر إلى الله"}
            </Text>
            <Text style={[styles.profileSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
              {progress?.covenantSigned
                ? `يوم ${progress.day40Progress ?? 0} من 40 — ${progress.currentPhase ?? "البداية"}`
                : "لم يبدأ الرحلة بعد"}
            </Text>
          </View>
          {progress?.streakDays ? (
            <View style={[styles.streakBadge, { backgroundColor: C.accent + "22" }]}>
              <Feather name="zap" size={14} color={C.accent} />
              <Text style={[styles.streakText, { color: C.accent, fontFamily: "Cairo_700Bold" }]}>
                {progress.streakDays}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Menu Groups */}
        {menuGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: C.textMuted, fontFamily: "Cairo_600SemiBold" }]}>
              {group.title}
            </Text>
            <View style={[styles.groupCard, { backgroundColor: C.card, borderColor: C.border }]}>
              {group.items.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <Pressable
                    style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      item.onPress();
                    }}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.color + "22" }]}>
                      <Feather name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
                        {item.label}
                      </Text>
                      {item.sublabel && (
                        <Text style={[styles.menuSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                          {item.sublabel}
                        </Text>
                      )}
                    </View>
                    {item.badge && (
                      <View style={[styles.badge, { backgroundColor: C.danger }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Feather name="chevron-left" size={18} color={C.textMuted} />
                  </Pressable>
                  {idx < group.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: C.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26 },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 17, marginBottom: 3 },
  profileSub: { fontSize: 13 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: { fontSize: 16 },
  group: { marginHorizontal: 20, marginBottom: 16 },
  groupTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, marginBottom: 1 },
  menuSub: { fontSize: 12 },
  divider: { height: 1, marginLeft: 64 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
