import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { apiFetch } from "@/lib/api";

interface CommunityDua {
  id: number;
  content: string;
  amenCount: number;
  createdAt: string;
}

export default function CommunityDuasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [duas, setDuas] = useState<CommunityDua[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newDua, setNewDua] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [amenedIds, setAmenedIds] = useState<Set<number>>(new Set());
  const [showCompose, setShowCompose] = useState(false);

  const loadDuas = useCallback(async () => {
    try {
      const data = await apiFetch<CommunityDua[]>("/community-duas?limit=30");
      setDuas(data);
    } catch {
      setDuas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDuas();
  }, [loadDuas]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDuas();
  };

  const handleAmeen = async (id: number) => {
    if (amenedIds.has(id)) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmenedIds((prev) => new Set(prev).add(id));
    setDuas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, amenCount: d.amenCount + 1 } : d))
    );
    try {
      await apiFetch(`/community-duas/${id}/amen`, { method: "POST", body: JSON.stringify({}) });
    } catch {
      setAmenedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setDuas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, amenCount: Math.max(0, d.amenCount - 1) } : d))
      );
    }
  };

  const handlePost = async () => {
    if (!newDua.trim() || newDua.trim().length < 5) {
      setError("الرجاء كتابة دعاء أطول");
      return;
    }
    if (newDua.trim().length > 300) {
      setError("الدعاء لا يتجاوز 300 حرف");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosting(true);
    setError("");
    try {
      const result = await apiFetch<{ dua: CommunityDua }>("/community-duas", {
        method: "POST",
        body: JSON.stringify({ content: newDua.trim() }),
      });
      setDuas((prev) => [result.dua, ...prev]);
      setNewDua("");
      setShowCompose(false);
    } catch {
      setError("تعذّر نشر الدعاء، حاول مجدداً");
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
      if (diffH < 1) return "منذ لحظات";
      if (diffH < 24) return `منذ ${diffH} ساعة`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `منذ ${diffD} أيام`;
      return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    } catch { return ""; }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: C.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-right" size={22} color={C.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
            دعاء الجماعة
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompose(!showCompose);
              setError("");
            }}
            style={[styles.addBtn, { backgroundColor: "#8E5CA8" }]}
          >
            <Feather name={showCompose ? "x" : "plus"} size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Compose Box */}
        {showCompose && (
          <View style={[styles.composeBox, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.composeLabel, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
              شارك دعاءك مع الجميع
            </Text>
            <TextInput
              style={[styles.composeInput, { color: C.text, backgroundColor: C.background, borderColor: error ? C.danger : C.border, fontFamily: "Cairo_400Regular" }]}
              placeholder="اللهم اغفر لنا واعف عنا..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={3}
              value={newDua}
              onChangeText={(t) => { setNewDua(t); setError(""); }}
              textAlign="right"
              maxLength={300}
            />
            <View style={styles.composeFooter}>
              {error ? (
                <Text style={[styles.errorText, { color: C.danger, fontFamily: "Cairo_400Regular" }]}>{error}</Text>
              ) : (
                <Text style={[styles.charCount, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                  {newDua.length}/300
                </Text>
              )}
              <Pressable
                style={[styles.postBtn, { backgroundColor: "#8E5CA8", opacity: posting ? 0.6 : 1 }]}
                onPress={handlePost}
                disabled={posting}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="send" size={14} color="#fff" />
                    <Text style={[styles.postBtnText, { fontFamily: "Cairo_700Bold" }]}>نشر</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Duas List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#8E5CA8" size="large" />
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8E5CA8" />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Banner */}
            <View style={[styles.banner, { backgroundColor: "#8E5CA8" }]}>
              <Text style={{ fontSize: 32 }}>🤲</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { fontFamily: "Cairo_700Bold" }]}>
                  قل آمين
                </Text>
                <Text style={[styles.bannerSub, { fontFamily: "Cairo_400Regular" }]}>
                  ادعُ مع إخوانك التائبين واضغط آمين
                </Text>
              </View>
            </View>

            {duas.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="users" size={48} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>
                  لا يوجد أدعية بعد
                </Text>
                <Text style={[styles.emptySub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                  كن أول من يشارك دعاءه
                </Text>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: "#8E5CA8" }]}
                  onPress={() => setShowCompose(true)}
                >
                  <Text style={[styles.emptyBtnText, { fontFamily: "Cairo_600SemiBold" }]}>أضف دعاء</Text>
                </Pressable>
              </View>
            ) : (
              duas.map((dua) => {
                const amened = amenedIds.has(dua.id);
                return (
                  <View
                    key={dua.id}
                    style={[styles.duaCard, { backgroundColor: C.card, borderColor: C.border }]}
                  >
                    <Text style={[styles.duaContent, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                      {dua.content}
                    </Text>
                    <View style={styles.duaFooter}>
                      <Text style={[styles.duaDate, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                        {formatDate(dua.createdAt)}
                      </Text>
                      <Pressable
                        onPress={() => handleAmeen(dua.id)}
                        style={[
                          styles.amenBtn,
                          {
                            backgroundColor: amened ? "#8E5CA8" : C.background,
                            borderColor: amened ? "#8E5CA8" : C.border,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14 }}>🤲</Text>
                        <Text
                          style={[
                            styles.amenText,
                            { color: amened ? "#fff" : C.textSecondary, fontFamily: "Cairo_700Bold" },
                          ]}
                        >
                          آمين {dua.amenCount > 0 ? `· ${dua.amenCount.toLocaleString("ar-SA")}` : ""}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
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
  composeBox: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  composeLabel: { fontSize: 14 },
  composeInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    lineHeight: 26,
    minHeight: 80,
    textAlignVertical: "top",
  },
  composeFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  charCount: { fontSize: 12 },
  errorText: { fontSize: 12, flex: 1 },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  postBtnText: { color: "#fff", fontSize: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  bannerTitle: { color: "#fff", fontSize: 18 },
  bannerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 3 },
  emptyState: { alignItems: "center", gap: 12, paddingTop: 40 },
  emptyTitle: { fontSize: 18 },
  emptySub: { fontSize: 14 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15 },
  duaCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  duaContent: { fontSize: 17, lineHeight: 32, textAlign: "right" },
  duaFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  duaDate: { fontSize: 12 },
  amenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  amenText: { fontSize: 14 },
});
