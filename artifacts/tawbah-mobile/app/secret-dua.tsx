import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { apiFetch } from "@/lib/api";

interface ReceivedDua {
  content: string;
  createdAt: string;
}

interface SecretDuaStats {
  total: number;
}

type ScreenState = "home" | "send" | "sent" | "received";

export default function SecretDuaScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [state, setState] = useState<ScreenState>("home");
  const [duaText, setDuaText] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [receivedDua, setReceivedDua] = useState<ReceivedDua | null>(null);
  const [stats, setStats] = useState<SecretDuaStats>({ total: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiFetch<SecretDuaStats>("/secret-dua/stats");
      setStats(data);
    } catch {}
  };

  const handleSend = async () => {
    if (!duaText.trim() || duaText.trim().length < 5) {
      setError("الرجاء كتابة دعاء أطول");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setError("");
    try {
      await apiFetch("/secret-dua", {
        method: "POST",
        body: JSON.stringify({ content: duaText.trim() }),
      });
      setState("sent");
      setDuaText("");
      loadStats();
    } catch {
      setError("تعذّر إرسال الدعاء، حاول مجدداً");
    } finally {
      setSending(false);
    }
  };

  const handleCheckReceived = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecking(true);
    try {
      const data = await apiFetch<{ dua: ReceivedDua | null }>("/secret-dua/received");
      setReceivedDua(data.dua);
      setState("received");
    } catch {
      setError("تعذّر التحقق من الأدعية");
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ar-SA", { month: "long", day: "numeric" });
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
          <Pressable
            onPress={() => (state === "home" ? router.back() : setState("home"))}
            style={styles.backBtn}
          >
            <Feather name="chevron-right" size={22} color={C.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
            الدعاء السري
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 34 : insets.bottom + 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HOME STATE ── */}
          {state === "home" && (
            <>
              {/* Hero */}
              <View style={[styles.heroCard, { backgroundColor: "#4A90B8" }]}>
                <Text style={[styles.heroIcon]}>🤲</Text>
                <Text style={[styles.heroTitle, { fontFamily: "Cairo_700Bold" }]}>
                  ادعُ لأخيك سراً
                </Text>
                <Text style={[styles.heroSub, { fontFamily: "Cairo_400Regular" }]}>
                  ترسل دعاءك لأخٍ مجهول، وهو يدعو لك بمثله — والملَك يؤمّن لكما
                </Text>
                <View style={[styles.statsBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Feather name="heart" size={13} color="#fff" />
                  <Text style={[styles.statsText, { fontFamily: "Cairo_600SemiBold" }]}>
                    {stats.total.toLocaleString("ar-SA")} دعاء أُرسل حتى الآن
                  </Text>
                </View>
              </View>

              {/* Info */}
              <View style={[styles.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[styles.hadith, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                  «دَعْوَةُ الْمَرْءِ الْمُسْلِمِ لِأَخِيهِ بِظَهْرِ الْغَيْبِ مُسْتَجَابَةٌ»
                </Text>
                <Text style={[styles.hadithSource, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                  رواه مسلم
                </Text>
              </View>

              {/* Action Buttons */}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#4A90B8" }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setState("send");
                }}
              >
                <Feather name="send" size={18} color="#fff" />
                <Text style={[styles.primaryBtnText, { fontFamily: "Cairo_700Bold" }]}>
                  أرسل دعاءً سرياً
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, { backgroundColor: C.card, borderColor: C.border }]}
                onPress={handleCheckReceived}
                disabled={checking}
              >
                {checking ? (
                  <ActivityIndicator color={C.primary} size="small" />
                ) : (
                  <Feather name="inbox" size={18} color={C.primary} />
                )}
                <Text style={[styles.secondaryBtnText, { color: C.primary, fontFamily: "Cairo_700Bold" }]}>
                  هل وصلني دعاء؟
                </Text>
              </Pressable>
            </>
          )}

          {/* ── SEND STATE ── */}
          {state === "send" && (
            <>
              <Text style={[styles.sectionTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                اكتب دعاءك لأخيك
              </Text>
              <Text style={[styles.sectionSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                سيُرسَل دعاؤك لشخص مجهول يرجو المغفرة مثلك
              </Text>

              <View style={[styles.textAreaContainer, { backgroundColor: C.card, borderColor: error ? C.danger : C.border }]}>
                <TextInput
                  style={[styles.textArea, { color: C.text, fontFamily: "Cairo_400Regular" }]}
                  placeholder="اللهم اغفر لأخي وثبّته على التوبة..."
                  placeholderTextColor={C.textMuted}
                  multiline
                  numberOfLines={5}
                  value={duaText}
                  onChangeText={(t) => { setDuaText(t); setError(""); }}
                  textAlign="right"
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                  {duaText.length}/500
                </Text>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: C.danger, fontFamily: "Cairo_400Regular" }]}>{error}</Text>
              ) : null}

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#4A90B8", opacity: sending ? 0.6 : 1 }]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="send" size={18} color="#fff" />
                )}
                <Text style={[styles.primaryBtnText, { fontFamily: "Cairo_700Bold" }]}>
                  {sending ? "جارٍ الإرسال..." : "أرسل الدعاء"}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── SENT STATE ── */}
          {state === "sent" && (
            <View style={styles.resultContainer}>
              <View style={[styles.resultIcon, { backgroundColor: "#4A90B8" + "20" }]}>
                <Text style={{ fontSize: 48 }}>🕊️</Text>
              </View>
              <Text style={[styles.resultTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                وصل دعاؤك!
              </Text>
              <Text style={[styles.resultSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                أرسلنا دعاءك لأخ مجهول، وبإذن الله ملَكٌ يؤمّن لك
              </Text>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#4A90B8" }]}
                onPress={() => setState("home")}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Cairo_700Bold" }]}>العودة</Text>
              </Pressable>
            </View>
          )}

          {/* ── RECEIVED STATE ── */}
          {state === "received" && (
            <View style={styles.resultContainer}>
              {receivedDua ? (
                <>
                  <Text style={[styles.receivedLabel, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    وصلك دعاء من أخٍ يحبك في الله
                  </Text>
                  {receivedDua.createdAt && (
                    <Text style={[styles.receivedDate, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                      {formatDate(receivedDua.createdAt)}
                    </Text>
                  )}
                  <View style={[styles.receivedCard, { backgroundColor: "#4A90B8" + "15", borderColor: "#4A90B8" + "40" }]}>
                    <Text style={{ fontSize: 32, textAlign: "center" }}>🤲</Text>
                    <Text style={[styles.receivedText, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                      {receivedDua.content}
                    </Text>
                  </View>
                  <Text style={[styles.aminText, { color: "#4A90B8", fontFamily: "Cairo_700Bold" }]}>
                    آمين يا رب العالمين
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.resultIcon, { backgroundColor: C.border }]}>
                    <Feather name="inbox" size={48} color={C.textMuted} />
                  </View>
                  <Text style={[styles.resultTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
                    لا يوجد دعاء بعد
                  </Text>
                  <Text style={[styles.resultSub, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
                    ابدأ بإرسال دعاء لأخيك وسيأتيك دعاؤه
                  </Text>
                </>
              )}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#4A90B8" }]}
                onPress={() => setState("home")}
              >
                <Text style={[styles.primaryBtnText, { fontFamily: "Cairo_700Bold" }]}>العودة</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
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
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  heroIcon: { fontSize: 44 },
  heroTitle: { color: "#fff", fontSize: 22, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", lineHeight: 24 },
  statsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 6,
  },
  statsText: { color: "#fff", fontSize: 13 },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  hadith: { fontSize: 16, textAlign: "center", lineHeight: 30 },
  hadithSource: { fontSize: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 16 },
  sectionTitle: { fontSize: 20, marginBottom: 6 },
  sectionSub: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 28,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, textAlign: "left", marginTop: 6 },
  errorText: { fontSize: 13, marginBottom: 10 },
  resultContainer: { alignItems: "center", gap: 16, paddingTop: 20 },
  resultIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 22, textAlign: "center" },
  resultSub: { fontSize: 14, textAlign: "center", lineHeight: 24 },
  receivedLabel: { fontSize: 14, textAlign: "center" },
  receivedDate: { fontSize: 12 },
  receivedCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    alignItems: "center",
  },
  receivedText: { fontSize: 18, lineHeight: 34, textAlign: "center" },
  aminText: { fontSize: 20 },
});
