import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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
import {
  AppNotification,
  loadNotifications,
  markAllAsRead,
  markAsRead,
} from "@/lib/notifications";
import { useApp } from "@/context/AppContext";

const TYPE_CONFIG: Record<
  AppNotification["type"],
  { icon: React.ComponentProps<typeof Feather>["name"]; defaultColor: string }
> = {
  reminder: { icon: "bell", defaultColor: "#C8963E" },
  achievement: { icon: "award", defaultColor: "#C8963E" },
  community: { icon: "users", defaultColor: "#4A90B8" },
  spiritual: { icon: "book-open", defaultColor: "#2E7D52" },
  warning: { icon: "alert-circle", defaultColor: "#C0392B" },
};

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} أيام`;
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { refreshUnreadCount } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        setLoading(true);
        const data = await loadNotifications();
        if (!active) return;
        setNotifications(data);
        setLoading(false);

        await markAllAsRead();
        await refreshUnreadCount();
      };

      load();
      return () => { active = false; };
    }, [refreshUnreadCount])
  );

  const handleDelete = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const updated = notifications.filter((n) => n.id !== id);
    const { saveNotifications } = await import("@/lib/notifications");
    await saveNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-right" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
            الإشعارات
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: C.primary }]}>
              <Text style={[styles.headerBadgeText, { fontFamily: "Cairo_700Bold" }]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: C.card, borderColor: C.border }]}>
            <Feather name="bell-off" size={40} color={C.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
            لا توجد إشعارات
          </Text>
          <Text style={[styles.emptyDesc, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
            ستصلك الإشعارات والتذكيرات هنا
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
        >
          {notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type];
            const iconName = (notif.icon as React.ComponentProps<typeof Feather>["name"]) ?? cfg.icon;
            const color = notif.color ?? cfg.defaultColor;

            return (
              <Pressable
                key={notif.id}
                style={({ pressed }) => [
                  styles.notifCard,
                  {
                    backgroundColor: notif.isRead ? C.card : C.primary + "10",
                    borderColor: notif.isRead ? C.border : C.primary + "40",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={async () => {
                  if (!notif.isRead) {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await markAsRead(notif.id);
                    setNotifications((prev) =>
                      prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n)
                    );
                    await refreshUnreadCount();
                  }
                }}
              >
                {/* Unread dot */}
                {!notif.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: C.primary }]} />
                )}

                <View style={[styles.notifIcon, { backgroundColor: color + "20" }]}>
                  <Feather name={iconName} size={20} color={color} />
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text
                      style={[
                        styles.notifTitle,
                        {
                          color: C.text,
                          fontFamily: notif.isRead ? "Cairo_600SemiBold" : "Cairo_700Bold",
                        },
                      ]}
                    >
                      {notif.title}
                    </Text>
                    <Text style={[styles.notifTime, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                      {timeAgo(notif.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.notifBody, { color: notif.isRead ? C.textMuted : C.textSecondary, fontFamily: "Cairo_400Regular" }]}>
                    {notif.body}
                  </Text>
                </View>

                <Pressable
                  hitSlop={8}
                  onPress={() => handleDelete(notif.id)}
                  style={styles.deleteBtn}
                >
                  <Feather name="x" size={15} color={C.textMuted} />
                </Pressable>
              </Pressable>
            );
          })}
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20 },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: { color: "#fff", fontSize: 11 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 40,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifContent: { flex: 1, gap: 5 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
  notifTitle: { fontSize: 15, flex: 1 },
  notifTime: { fontSize: 11, flexShrink: 0 },
  notifBody: { fontSize: 13, lineHeight: 22 },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
