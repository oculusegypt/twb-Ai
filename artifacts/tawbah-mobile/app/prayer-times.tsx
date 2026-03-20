import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface AladhanResponse {
  data: {
    timings: PrayerTimes;
    date: {
      readable: string;
      hijri: { date: string; month: { ar: string }; year: string; weekday: { ar: string } };
    };
    meta: { timezone: string; city?: string; country?: string };
  };
}

const PRAYERS = [
  { key: "Fajr", nameAr: "الفجر", icon: "moon" as const },
  { key: "Sunrise", nameAr: "الشروق", icon: "sun" as const },
  { key: "Dhuhr", nameAr: "الظهر", icon: "sun" as const },
  { key: "Asr", nameAr: "العصر", icon: "cloud" as const },
  { key: "Maghrib", nameAr: "المغرب", icon: "sunset" as const },
  { key: "Isha", nameAr: "العشاء", icon: "star" as const },
];

function getNextPrayer(timings: PrayerTimes): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const nowMinutes = h * 60 + m;

  for (const p of PRAYERS) {
    const time = timings[p.key as keyof PrayerTimes];
    const [ph, pm] = time.split(":").map(Number);
    if ((ph! * 60 + pm!) > nowMinutes) return p.key;
  }
  return "Fajr";
}

function timeUntil(timeStr: string): string {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  let diff = (h! * 60 + m!) - (now.getHours() * 60 + now.getMinutes());
  if (diff < 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0) return `${hours}س ${mins}د`;
  return `${mins} دقيقة`;
}

export default function PrayerTimesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState("");
  const [hijriDay, setHijriDay] = useState("");
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = isWeb ? 67 : insets.top;

  const fetchPrayerTimes = useCallback(async () => {
    try {
      setError("");
      let lat = 21.4225;
      let lon = 39.8262;

      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;

          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (geo[0]) {
            const city = geo[0].city || geo[0].region || "";
            const country = geo[0].country || "";
            setLocationName(city ? `${city}, ${country}` : country);
          }
        }
      }

      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=4`;
      const res = await fetch(url);
      const json: AladhanResponse = await res.json();

      setTimings(json.data.timings);
      const h = json.data.date.hijri;
      setHijriDate(`${h.date} ${h.month.ar} ${h.year}`);
      setHijriDay(h.weekday.ar);
    } catch {
      setError("تعذّر تحميل أوقات الصلاة");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayerTimes();
  };

  const nextPrayer = timings ? getNextPrayer(timings) : null;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-right" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: "Cairo_700Bold" }]}>
          أوقات الصلاة
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={[styles.loadingText, { color: C.textMuted, fontFamily: "Cairo_400Regular" }]}>
            جارٍ تحديد موقعك...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={48} color={C.textMuted} />
          <Text style={[styles.errorText, { color: C.text, fontFamily: "Cairo_600SemiBold" }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: C.primary }]} onPress={fetchPrayerTimes}>
            <Text style={[styles.retryText, { fontFamily: "Cairo_600SemiBold" }]}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 40 }}
        >
          {/* Hijri Date Card */}
          <View style={[styles.dateCard, { backgroundColor: C.primary }]}>
            <Text style={[styles.hijriDay, { fontFamily: "Cairo_700Bold" }]}>{hijriDay}</Text>
            <Text style={[styles.hijriDate, { fontFamily: "Cairo_700Bold" }]}>{hijriDate}</Text>
            {locationName ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.locationText, { fontFamily: "Cairo_400Regular" }]}>{locationName}</Text>
              </View>
            ) : null}
            {nextPrayer && timings && (
              <View style={[styles.nextPrayerBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="clock" size={13} color="#fff" />
                <Text style={[styles.nextPrayerText, { fontFamily: "Cairo_600SemiBold" }]}>
                  {PRAYERS.find(p => p.key === nextPrayer)?.nameAr} بعد {timeUntil(timings[nextPrayer as keyof PrayerTimes])}
                </Text>
              </View>
            )}
          </View>

          {/* Prayer Times List */}
          <View style={[styles.prayersCard, { backgroundColor: C.card, borderColor: C.border }]}>
            {PRAYERS.map((prayer, idx) => {
              const time = timings?.[prayer.key as keyof PrayerTimes] ?? "--:--";
              const isNext = prayer.key === nextPrayer;
              return (
                <React.Fragment key={prayer.key}>
                  <View
                    style={[
                      styles.prayerRow,
                      isNext && { backgroundColor: C.primary + "18" },
                    ]}
                  >
                    <View style={[styles.prayerIcon, { backgroundColor: (isNext ? C.primary : C.textMuted) + "22" }]}>
                      <Feather name={prayer.icon} size={18} color={isNext ? C.primary : C.textMuted} />
                    </View>
                    <Text style={[styles.prayerName, { color: isNext ? C.primary : C.text, fontFamily: "Cairo_700Bold" }]}>
                      {prayer.nameAr}
                    </Text>
                    <View style={styles.prayerRight}>
                      {isNext && (
                        <View style={[styles.nextBadge, { backgroundColor: C.accent + "22" }]}>
                          <Text style={[styles.nextBadgeText, { color: C.accent, fontFamily: "Cairo_600SemiBold" }]}>
                            التالية
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.prayerTime, { color: isNext ? C.primary : C.text, fontFamily: "Cairo_700Bold" }]}>
                        {time}
                      </Text>
                    </View>
                  </View>
                  {idx < PRAYERS.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: C.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Tip */}
          <View style={[styles.tipCard, { backgroundColor: C.accent + "15", borderColor: C.accent + "40" }]}>
            <Feather name="info" size={16} color={C.accent} />
            <Text style={[styles.tipText, { color: C.textSecondary, fontFamily: "Cairo_400Regular" }]}>
              المحافظة على الصلوات الخمس من أقوى أسباب ثبات التوبة وتزكية النفس.
            </Text>
          </View>
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
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 17, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: "#fff", fontSize: 15 },
  dateCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  hijriDay: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  hijriDate: { color: "#fff", fontSize: 22, textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  locationText: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  nextPrayerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  nextPrayerText: { color: "#fff", fontSize: 14 },
  prayersCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  prayerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerName: { fontSize: 16, flex: 1 },
  prayerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nextBadgeText: { fontSize: 11 },
  prayerTime: { fontSize: 18, minWidth: 55, textAlign: "right" },
  divider: { height: 1, marginLeft: 66 },
  tipCard: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 22 },
});
