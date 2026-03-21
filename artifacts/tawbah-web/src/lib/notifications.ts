// ── Notification Settings Types ───────────────────────────────────────────────

export interface PrayerNotifSettings {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  advanceMinutes: number; // 0 = at prayer time, 5, 10, 15, 20, 30
}

export interface NotificationSettings {
  // Permission
  enabled: boolean;

  // ── Prayers ──────────────────────────────────────────
  prayers: PrayerNotifSettings;

  // ── Adhkar ───────────────────────────────────────────
  morningAdhkar: boolean;
  morningAdhkarTime: string; // "06:30"
  eveningAdhkar: boolean;
  eveningAdhkarTime: string; // "17:00"

  // ── Daily dhikr ──────────────────────────────────────
  dhikrReminder: boolean;
  dhikrReminderTime: string; // "12:00"

  // ── Journey ──────────────────────────────────────────
  journeyReminder: boolean;
  journeyReminderTime: string; // "21:00"

  // ── Nafl fasting ─────────────────────────────────────
  mondayFasting: boolean;
  thursdayFasting: boolean;
  ayyamBeedh: boolean;

  // ── Evening review ────────────────────────────────────
  eveningReview: boolean;
  eveningReviewTime: string; // "22:00"

  // ── Friday special ────────────────────────────────────
  fridayKahf: boolean;
  fridayKahfTime: string; // "09:00"

  // ── Streak reminder ───────────────────────────────────
  streakReminder: boolean;
  streakReminderTime: string; // "20:00"
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  prayers: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    advanceMinutes: 10,
  },
  morningAdhkar: true,
  morningAdhkarTime: "06:30",
  eveningAdhkar: true,
  eveningAdhkarTime: "17:00",
  dhikrReminder: false,
  dhikrReminderTime: "12:00",
  journeyReminder: true,
  journeyReminderTime: "21:00",
  mondayFasting: false,
  thursdayFasting: false,
  ayyamBeedh: false,
  eveningReview: false,
  eveningReviewTime: "22:00",
  fridayKahf: false,
  fridayKahfTime: "09:00",
  streakReminder: false,
  streakReminderTime: "20:00",
};

const STORAGE_KEY = "notif_settings_v2";

export function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export function getPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

// ── Service Worker ────────────────────────────────────────────────────────────

let swReg: ServiceWorkerRegistration | null = null;

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return swReg;
  } catch {
    return null;
  }
}

// Post a message to the active service worker reliably.
// Using navigator.serviceWorker.ready guarantees we have an active SW,
// avoiding the null-controller bug that happens on first page load.
async function postToSW(message: unknown): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active;
    if (sw) sw.postMessage(message);
  } catch {
    // SW unavailable — ignore silently
  }
}

// ── Scheduled notification type ───────────────────────────────────────────────

interface ScheduledNotif {
  tag: string;
  title: string;
  body: string;
  fireAt: number; // unix ms
  url?: string;
}

// ── Prayer times fetching ─────────────────────────────────────────────────────

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PRAYER_CACHE_KEY = "prayer_timings_cache";

async function fetchPrayerTimings(): Promise<PrayerTimings | null> {
  const city = localStorage.getItem("prayerCity");
  const country = localStorage.getItem("prayerCountry");
  if (!city || !country) return null;

  // Try cache (valid for today)
  try {
    const raw = localStorage.getItem(PRAYER_CACHE_KEY);
    if (raw) {
      const { date, timings } = JSON.parse(raw) as { date: string; timings: PrayerTimings };
      const today = new Date().toDateString();
      if (date === today) return timings;
    }
  } catch { /* continue */ }

  try {
    const lat = localStorage.getItem("prayerLat");
    const lng = localStorage.getItem("prayerLng");
    const url = (country === "Auto" && lat && lng)
      ? `https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&method=4`
      : `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { code: number; data: { timings: PrayerTimings } };
    if (data.code !== 200) return null;
    const t = data.data.timings;
    const clean: PrayerTimings = {
      Fajr: t.Fajr.split(" ")[0]!,
      Sunrise: t.Sunrise.split(" ")[0]!,
      Dhuhr: t.Dhuhr.split(" ")[0]!,
      Asr: t.Asr.split(" ")[0]!,
      Maghrib: t.Maghrib.split(" ")[0]!,
      Isha: t.Isha.split(" ")[0]!,
    };
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ date: new Date().toDateString(), timings: clean }));
    return clean;
  } catch {
    return null;
  }
}

function timeToMs(hhmm: string, advanceMinutes = 0): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h!, m! - advanceMinutes, 0, 0);
  return target.getTime();
}

function todayTimeMs(hhmm: string): number {
  return timeToMs(hhmm, 0);
}

function getHijriMonth(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    month: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  const m = parts.find(p => p.type === "month");
  return m ? parseInt(m.value) : 0;
}

function getHijriDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  const d = parts.find(p => p.type === "day");
  return d ? parseInt(d.value) : 0;
}

// ── Build scheduled notifications list ────────────────────────────────────────

export async function buildScheduledNotifications(
  settings: NotificationSettings,
  // When true, also includes notifications that fired within the last pastWindowMs ms
  // (used by the in-app polling to catch recently-missed ones)
  pastWindowMs = 0
): Promise<ScheduledNotif[]> {
  const now = Date.now();
  const notifs: ScheduledNotif[] = [];
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 5=Fri, 6=Sat

  // ── Prayer times ────────────────────────────────────────────────────────────
  const prayerTimings = settings.prayers.fajr || settings.prayers.dhuhr ||
    settings.prayers.asr || settings.prayers.maghrib || settings.prayers.isha ||
    settings.prayers.sunrise
    ? await fetchPrayerTimings()
    : null;

  const PRAYER_MAP: Array<{ key: keyof typeof settings.prayers; time: keyof PrayerTimings; nameAr: string; body: string; url: string }> = [
    { key: "fajr",    time: "Fajr",    nameAr: "الفجر",   body: "حان وقت صلاة الفجر — ﴿وَقُرْآنَ الْفَجْرِ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾", url: "/prayer-times" },
    { key: "sunrise", time: "Sunrise", nameAr: "الشروق",  body: "وقت صلاة الإشراق — اجلس تذكر الله حتى الشروق واحصل على أجر حجة وعمرة", url: "/prayer-times" },
    { key: "dhuhr",   time: "Dhuhr",   nameAr: "الظهر",   body: "حان وقت صلاة الظهر — لا تؤخّرها، الله ينتظر عبده", url: "/prayer-times" },
    { key: "asr",     time: "Asr",     nameAr: "العصر",   body: "حان وقت صلاة العصر — ﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾", url: "/prayer-times" },
    { key: "maghrib", time: "Maghrib", nameAr: "المغرب",  body: "حان وقت صلاة المغرب — ساعة مباركة، الدعاء مستجاب بين الأذان والإقامة", url: "/prayer-times" },
    { key: "isha",    time: "Isha",    nameAr: "العشاء",  body: "حان وقت صلاة العشاء — «من صلى العشاء في جماعة فكأنما قام نصف الليل»", url: "/prayer-times" },
  ];

  if (prayerTimings) {
    for (const p of PRAYER_MAP) {
      if (!settings.prayers[p.key]) continue;
      const fireAt = timeToMs(prayerTimings[p.time], settings.prayers.advanceMinutes);
      if (fireAt > now - pastWindowMs) {
        notifs.push({
          tag: `prayer-${p.key}`,
          title: `🕌 وقت صلاة ${p.nameAr}`,
          body: settings.prayers.advanceMinutes > 0
            ? `بعد ${settings.prayers.advanceMinutes} دقيقة — ${p.body}`
            : p.body,
          fireAt,
          url: p.url,
        });
      }
    }
  }

  // ── Morning adhkar ───────────────────────────────────────────────────────────
  if (settings.morningAdhkar) {
    const fireAt = todayTimeMs(settings.morningAdhkarTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "morning-adhkar",
        title: "📿 أذكار الصباح",
        body: "لا تنسَ أذكار الصباح — «ما من عبد يقول في صباح كل يوم وفي مساء كل ليلة...» ابدأ الآن",
        fireAt,
        url: "/dhikr",
      });
    }
  }

  // ── Evening adhkar ───────────────────────────────────────────────────────────
  if (settings.eveningAdhkar) {
    const fireAt = todayTimeMs(settings.eveningAdhkarTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "evening-adhkar",
        title: "🌙 أذكار المساء",
        body: "حان وقت أذكار المساء — أنت بحاجة إلى حصن الذكر الآن",
        fireAt,
        url: "/dhikr",
      });
    }
  }

  // ── Daily dhikr reminder ─────────────────────────────────────────────────────
  if (settings.dhikrReminder) {
    const fireAt = todayTimeMs(settings.dhikrReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "dhikr-reminder",
        title: "📿 تذكير الذكر اليومي",
        body: "خصّص لحظات من يومك لذكر الله — سبحان الله وبحمده سبحان الله العظيم",
        fireAt,
        url: "/dhikr",
      });
    }
  }

  // ── Journey reminder ─────────────────────────────────────────────────────────
  if (settings.journeyReminder) {
    const fireAt = todayTimeMs(settings.journeyReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "journey-reminder",
        title: "🌟 رحلة التوبة اليومية",
        body: "هل أكملت ورد اليوم؟ كل يوم في الرحلة هو خطوة نحو ربك",
        fireAt,
        url: "/journey",
      });
    }
  }

  // ── Streak reminder ──────────────────────────────────────────────────────────
  if (settings.streakReminder) {
    const fireAt = todayTimeMs(settings.streakReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "streak-reminder",
        title: "🔥 تذكير الاستقامة اليومية",
        body: "حافظ على سلسلتك — سجّل يومك قبل منتصف الليل",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Evening review ───────────────────────────────────────────────────────────
  if (settings.eveningReview) {
    const fireAt = todayTimeMs(settings.eveningReviewTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "evening-review",
        title: "📔 مراجعة المساء",
        body: "قبل أن تنام — سجّل يومك، شكر ربك، وتُب إليه. اليوم قد لا يعود.",
        fireAt,
        url: "/journal",
      });
    }
  }

  // ── Friday Kahf reminder ─────────────────────────────────────────────────────
  if (settings.fridayKahf && dayOfWeek === 5) {
    const fireAt = todayTimeMs(settings.fridayKahfTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "friday-kahf",
        title: "📖 تذكير الجمعة المبارك",
        body: "يوم الجمعة — اقرأ سورة الكهف، أكثر من الصلاة على النبي ﷺ، وادعُ في ساعة الإجابة",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Monday fasting reminder (Sunday evening) ─────────────────────────────────
  if (settings.mondayFasting && dayOfWeek === 0) {
    const fireAt = todayTimeMs("20:00");
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "monday-fasting",
        title: "🌙 تذكير صيام الاثنين",
        body: "غداً الاثنين — يوم تُعرض فيه الأعمال على الله. هل ستصوم؟ النية الآن.",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Thursday fasting reminder (Wednesday evening) ────────────────────────────
  if (settings.thursdayFasting && dayOfWeek === 3) {
    const fireAt = todayTimeMs("20:00");
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "thursday-fasting",
        title: "🌙 تذكير صيام الخميس",
        body: "غداً الخميس — يوم تُعرض فيه الأعمال على الله. أحبّ أن يُعرَض عملي وأنا صائم.",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Ayyam al-beedh reminder ───────────────────────────────────────────────────
  if (settings.ayyamBeedh) {
    const hijriDay = getHijriDay(new Date());
    if ([12, 13, 14].includes(hijriDay)) {
      const fireAt = todayTimeMs("06:00");
      if (fireAt > now - pastWindowMs) {
        notifs.push({
          tag: "ayyam-beedh",
          title: "☀️ أيام البيض",
          body: `اليوم ${hijriDay} من الشهر — من أيام البيض المباركة. صيامها كصيام الدهر كله.`,
          fireAt,
          url: "/",
        });
      }
    }
  }

  return notifs;
}

// ── Server-side WebPush subscription ─────────────────────────────────────────

const API_BASE = "/api";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    // Fetch VAPID public key from server
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    if (!res.ok) return false;
    const { key } = await res.json() as { key: string };
    if (!key) return false;

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, subscription }),
    });
    return true;
  } catch {
    return false;
  }
}

// Schedule server-side push jobs so notifications fire even when app is closed
async function scheduleServerPush(notifs: { tag: string; title: string; body: string; fireAt: number; url?: string }[]): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    // Clear old pending jobs first
    await fetch(`${API_BASE}/push/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (notifs.length === 0) return;
    const jobs = notifs.map((n) => ({
      type: "reminder",
      title: n.title,
      body: n.body,
      url: n.url ?? "/",
      fireAt: new Date(n.fireAt).toISOString(),
    }));
    await fetch(`${API_BASE}/push/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, jobs }),
    });
  } catch {
    // Non-critical — local SW will still handle timers when app is open
  }
}

// ── Main scheduling entry point ───────────────────────────────────────────────

export async function scheduleAll(settings: NotificationSettings): Promise<void> {
  if (!settings.enabled || getPermission() !== "granted") {
    // If disabled, make sure the SW clears any stale timers
    await clearAll();
    return;
  }
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.ready;
  const notifs = await buildScheduledNotifications(settings);
  // Schedule in-browser SW timers (works when app is open)
  await postToSW({ type: "SCHEDULE_NOTIFICATIONS", notifications: notifs });
  // Schedule server-side push jobs (works even when app is fully closed)
  void scheduleServerPush(notifs);
}

export async function clearAll(): Promise<void> {
  await postToSW({ type: "CLEAR_ALL" });
}
