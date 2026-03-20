// In-app notification system for the web app (localStorage-based)

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

const STORAGE_KEY = "tawbah_web_inbox";

const SPIRITUAL_POOL: Omit<AppNotification, "id" | "isRead" | "createdAt">[] = [
  {
    type: "spiritual",
    title: "آية اليوم",
    body: "﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾ — البقرة: ٢٢٢",
    icon: "book-open",
    color: "#16a34a",
  },
  {
    type: "spiritual",
    title: "تذكّر",
    body: "«مَن تاب قبل أن تطلع الشمس من مغربها، تاب الله عليه» — رواه مسلم",
    icon: "sun",
    color: "#d97706",
  },
  {
    type: "spiritual",
    title: "قوّة الاستغفار",
    body: "«من أكثر من الاستغفار جعل الله له من كل هم فرجًا، ومن كل ضيق مخرجًا» — رواه أبو داود",
    icon: "heart",
    color: "#4A90B8",
  },
  {
    type: "spiritual",
    title: "آية كريمة",
    body: "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: ١١٠",
    icon: "book-open",
    color: "#16a34a",
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
    color: "#d97706",
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
    color: "#16a34a",
  },
  {
    type: "reminder",
    title: "قراءة القرآن",
    body: "لا تنسَ صفحتين من القرآن اليوم — هدفك اليومي ينتظرك ✨",
    icon: "book",
    color: "#16a34a",
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
  return `w_notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export function markAllAsRead(): void {
  const notifications = loadNotifications();
  const updated = notifications.map((n) => ({ ...n, isRead: true }));
  saveNotifications(updated);
}

export function markAsRead(id: string): void {
  const notifications = loadNotifications();
  const updated = notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications(updated);
}

export function deleteNotification(id: string): void {
  const notifications = loadNotifications();
  saveNotifications(notifications.filter((n) => n.id !== id));
}

export function getUnreadCount(): number {
  const notifications = loadNotifications();
  return notifications.filter((n) => !n.isRead).length;
}

export function seedDailyNotifications(
  streakDays: number,
  day40Progress: number,
  covenantSigned: boolean
): void {
  const existing = loadNotifications();
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
      color: "#d97706",
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
      color: "#16a34a",
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
      color: "#d97706",
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
      color: "#d97706",
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
      color: "#dc2626",
      isRead: false,
      createdAt: new Date(Date.now() - 240000).toISOString(),
    });
  }

  const merged = [...newNotifs, ...existing].slice(0, 50);
  saveNotifications(merged);
}
