import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppNotification {
  id: string;
  type: "reminder" | "achievement" | "community" | "spiritual" | "warning";
  title: string;
  body: string;
  icon: string;
  color: string;
  isRead: boolean;
  createdAt: string;
}

const STORAGE_KEY = "tawbah_notifications";

const SPIRITUAL_POOL: Omit<AppNotification, "id" | "isRead" | "createdAt">[] = [
  {
    type: "spiritual",
    title: "آية اليوم",
    body: "﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾ — البقرة: ٢٢٢",
    icon: "book-open",
    color: "#2E7D52",
  },
  {
    type: "spiritual",
    title: "تذكّر",
    body: "«مَن تاب قبل أن تطلع الشمس من مغربها، تاب الله عليه» — رواه مسلم",
    icon: "sun",
    color: "#C8963E",
  },
  {
    type: "spiritual",
    title: "قوّة الاستغفار",
    body: "«من أكثر من الاستغفار، جعل الله له من كل هم فرجًا، ومن كل ضيق مخرجًا» — رواه أبو داود",
    icon: "heart",
    color: "#4A90B8",
  },
  {
    type: "spiritual",
    title: "آية اليوم",
    body: "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: ١١٠",
    icon: "book-open",
    color: "#2E7D52",
  },
  {
    type: "spiritual",
    title: "رحمة الله واسعة",
    body: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾ — الزمر: ٥٣",
    icon: "sun",
    color: "#8E5CA8",
  },
];

const REMINDER_POOL: Omit<AppNotification, "id" | "isRead" | "createdAt">[] = [
  {
    type: "reminder",
    title: "ورد الصباح",
    body: "لا تنسَ ذكر الصباح — سيد الاستغفار يُحصّنك ليومك كله 🌅",
    icon: "sunrise",
    color: "#C8963E",
  },
  {
    type: "reminder",
    title: "ورد المساء",
    body: "اختم يومك بذكر المساء وسيد الاستغفار قبل النوم 🌙",
    icon: "moon",
    color: "#4A90B8",
  },
  {
    type: "reminder",
    title: "الأذكار اليومية",
    body: "حان وقت ورد الاستغفار اليومي ١٠٠ مرة — افتح عداد الذكر",
    icon: "refresh-cw",
    color: "#2E7D52",
  },
  {
    type: "reminder",
    title: "قراءة القرآن",
    body: "لا تنسَ صفحتين من القرآن اليوم — هدفك اليومي ينتظرك ✨",
    icon: "book",
    color: "#2E7D52",
  },
  {
    type: "reminder",
    title: "سجّل يومك",
    body: "كيف كان يومك الروحي؟ سجّله في مذكرتك الآن",
    icon: "pen-tool",
    color: "#8E5CA8",
  },
];

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export async function markAllAsRead(): Promise<void> {
  const notifications = await loadNotifications();
  const updated = notifications.map((n) => ({ ...n, isRead: true }));
  await saveNotifications(updated);
}

export async function markAsRead(id: string): Promise<void> {
  const notifications = await loadNotifications();
  const updated = notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
  await saveNotifications(updated);
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await loadNotifications();
  return notifications.filter((n) => !n.isRead).length;
}

export async function seedDailyNotifications(
  streakDays: number,
  day40Progress: number,
  covenantSigned: boolean
): Promise<void> {
  const existing = await loadNotifications();
  const today = todayStr();

  const todayNotifs = existing.filter((n) => n.createdAt.startsWith(today));

  if (todayNotifs.length > 0) return;

  const newNotifs: AppNotification[] = [];

  const spiritual = SPIRITUAL_POOL[day40Progress % SPIRITUAL_POOL.length]!;
  newNotifs.push({ ...spiritual, id: generateId(), isRead: false, createdAt: new Date().toISOString() });

  const reminder = REMINDER_POOL[Math.floor(Math.random() * REMINDER_POOL.length)]!;
  newNotifs.push({ ...reminder, id: generateId(), isRead: false, createdAt: new Date(Date.now() - 60000).toISOString() });

  if (covenantSigned && streakDays > 0 && streakDays % 7 === 0) {
    newNotifs.push({
      id: generateId(),
      type: "achievement",
      title: "🏆 إنجاز جديد!",
      body: `أكملت ${streakDays} يوماً متواصلاً من الاستقامة — ثبّتك الله وزادك من فضله`,
      icon: "award",
      color: "#C8963E",
      isRead: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    });
  }

  if (covenantSigned && day40Progress === 10) {
    newNotifs.push({
      id: generateId(),
      type: "achievement",
      title: "ربع الطريق! 🌿",
      body: "أتممت ١٠ أيام من رحلتك — الله يرى صدقك وثباتك",
      icon: "award",
      color: "#2E7D52",
      isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    });
  }

  if (covenantSigned && day40Progress === 20) {
    newNotifs.push({
      id: generateId(),
      type: "achievement",
      title: "منتصف الرحلة! ⭐",
      body: "٢٠ يوماً من الثبات — أنت أقرب إلى الله مما تتخيل",
      icon: "star",
      color: "#C8963E",
      isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    });
  }

  if (covenantSigned && day40Progress === 40) {
    newNotifs.push({
      id: generateId(),
      type: "achievement",
      title: "أكملت الرحلة! 🌟",
      body: "ماشاء الله! أتممت الأربعين يوماً — سأل الله أن تكون من التوابين",
      icon: "star",
      color: "#C8963E",
      isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
    });
  }

  if (!covenantSigned) {
    newNotifs.push({
      id: generateId(),
      type: "warning",
      title: "ابدأ رحلتك",
      body: "لم توقّع ميثاقك بعد — كل لحظة تأخير هي فرصة ضائعة للتوبة",
      icon: "alert-circle",
      color: "#C0392B",
      isRead: false,
      createdAt: new Date(Date.now() - 240000).toISOString(),
    });
  }

  const merged = [...newNotifs, ...existing].slice(0, 50);
  await saveNotifications(merged);
}
