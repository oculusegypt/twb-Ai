import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getSessionId(): Promise<string> {
  let sessionId = await AsyncStorage.getItem("@tawbah_session_id");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await AsyncStorage.setItem("@tawbah_session_id", sessionId);
  }
  return sessionId;
}

export const STORAGE_KEYS = {
  SESSION_ID: "@tawbah_session_id",
  PROGRESS: "@tawbah_progress",
  HABITS: "@tawbah_habits",
  DHIKR: "@tawbah_dhikr",
  SOS_DISMISSED: "@tawbah_sos",
};

export interface StoredProgress {
  sessionId: string;
  sinCategory: string;
  covenantSigned: boolean;
  covenantDate: string | null;
  currentPhase: number;
  day40Progress: number;
  firstDayTasksCompleted: boolean;
  streakDays: number;
  lastActiveDate: string | null;
}

export interface StoredHabit {
  habitKey: string;
  habitNameAr: string;
  completed: boolean;
  date: string;
}

export interface StoredDhikr {
  date: string;
  istighfar: number;
  tasbih: number;
  sayyid: number;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getProgress(): Promise<StoredProgress | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function saveProgress(progress: StoredProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

export async function getHabits(date: string, isFirstDay: boolean): Promise<StoredHabit[]> {
  const key = `${STORAGE_KEYS.HABITS}_${date}`;
  const raw = await AsyncStorage.getItem(key);
  if (raw) return JSON.parse(raw);

  const firstDayHabits: StoredHabit[] = [
    { habitKey: "wudu", habitNameAr: "توضأ الآن", completed: false, date },
    { habitKey: "salat_tawba", habitNameAr: "صلِّ ركعتين بنية التوبة", completed: false, date },
    { habitKey: "delete_apps", habitNameAr: "احذف التطبيقات المحرمة", completed: false, date },
    { habitKey: "change_env", habitNameAr: "غيّر بيئتك", completed: false, date },
  ];

  const dailyHabits: StoredHabit[] = [
    { habitKey: "istighfar_100", habitNameAr: "ورد الاستغفار (100 مرة)", completed: false, date },
    { habitKey: "quran", habitNameAr: "قراءة صفحتين من القرآن", completed: false, date },
    { habitKey: "witr", habitNameAr: "صلاة الوتر", completed: false, date },
    { habitKey: "sayyid_morning", habitNameAr: "سيد الاستغفار صباحاً", completed: false, date },
    { habitKey: "sayyid_evening", habitNameAr: "سيد الاستغفار مساءً", completed: false, date },
  ];

  const habits = isFirstDay ? firstDayHabits : dailyHabits;
  await AsyncStorage.setItem(key, JSON.stringify(habits));
  return habits;
}

export async function saveHabits(date: string, habits: StoredHabit[]): Promise<void> {
  const key = `${STORAGE_KEYS.HABITS}_${date}`;
  await AsyncStorage.setItem(key, JSON.stringify(habits));
}

export async function getDhikr(date: string): Promise<StoredDhikr> {
  const key = `${STORAGE_KEYS.DHIKR}_${date}`;
  const raw = await AsyncStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  return { date, istighfar: 0, tasbih: 0, sayyid: 0 };
}

export async function saveDhikr(date: string, dhikr: StoredDhikr): Promise<void> {
  const key = `${STORAGE_KEYS.DHIKR}_${date}`;
  await AsyncStorage.setItem(key, JSON.stringify(dhikr));
}
