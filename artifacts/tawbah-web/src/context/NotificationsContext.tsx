import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  type NotificationSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  requestPermission,
  getPermission,
  registerSW,
  scheduleAll,
  buildScheduledNotifications,
  subscribeToPush,
  showViaSW,
} from "@/lib/notifications";
import { hasFiredToday, markFiredToday, addToInboxApi } from "@/lib/app-notifications";

const API_BASE = "/api";

async function syncSettingsToApi(s: NotificationSettings): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${API_BASE}/notifications/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        settingsJson: JSON.stringify(s),
        prayerCity: localStorage.getItem("prayerCity") ?? undefined,
        prayerCountry: localStorage.getItem("prayerCountry") ?? undefined,
        prayerLat: localStorage.getItem("prayerLat") ?? undefined,
        prayerLng: localStorage.getItem("prayerLng") ?? undefined,
      }),
    });
  } catch {}
}

async function loadSettingsFromApi(): Promise<NotificationSettings | null> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    const res = await fetch(`${API_BASE}/notifications/settings?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    const row = await res.json() as {
      settingsJson: string;
      prayerCity?: string; prayerCountry?: string;
      prayerLat?: string; prayerLng?: string;
    } | null;
    if (!row || !row.settingsJson) return null;
    if (row.prayerCity && !localStorage.getItem("prayerCity")) localStorage.setItem("prayerCity", row.prayerCity);
    if (row.prayerCountry && !localStorage.getItem("prayerCountry")) localStorage.setItem("prayerCountry", row.prayerCountry);
    if (row.prayerLat && !localStorage.getItem("prayerLat")) localStorage.setItem("prayerLat", row.prayerLat);
    if (row.prayerLng && !localStorage.getItem("prayerLng")) localStorage.setItem("prayerLng", row.prayerLng);
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.settingsJson) } as NotificationSettings;
  } catch {
    return null;
  }
}

interface NotificationsContextValue {
  settings: NotificationSettings;
  permission: NotificationPermission;
  supported: boolean;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  reschedule: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const [permission, setPermission] = useState<NotificationPermission>(() => getPermission());
  const supported = "Notification" in window && "serviceWorker" in navigator;

  // Register SW on mount and re-subscribe to push if already enabled
  useEffect(() => {
    if (!supported) return;
    registerSW().then(() => {
      setPermission(getPermission());
      const s = loadSettings();
      if (s.enabled && getPermission() === "granted") {
        void subscribeToPush();
      }
    });
  }, [supported]);

  // Load settings from API on mount
  useEffect(() => {
    loadSettingsFromApi().then((apiSettings) => {
      if (apiSettings) {
        setSettings(apiSettings);
        saveSettings(apiSettings);
      }
    });
  }, []);

  const reschedule = useCallback(async () => {
    const fresh = loadSettings();
    await scheduleAll(fresh);
  }, []);

  useEffect(() => {
    reschedule();
  }, [settings, reschedule]);

  // Re-schedule server-side push when tab becomes visible (refresh subscription)
  useEffect(() => {
    if (!supported) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") reschedule();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [supported, reschedule]);

  // ── Listen for SW-fired notifications (push) → add to in-app inbox ───────────
  useEffect(() => {
    if (!supported) return;
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_FIRED") {
        const { tag, title, body } = event.data as {
          tag: string; title: string; body: string; url: string;
        };
        if (!hasFiredToday(tag)) {
          markFiredToday(tag);
          void addToInboxApi({ type: "reminder", title, body, icon: "bell", color: "#4A90B8" });
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, [supported]);

  // ── In-app polling every 30s — works on ALL pages while app is open ───────────
  // Uses SW showNotification() which works even in background tabs
  useEffect(() => {
    if (!settings.enabled || permission !== "granted" || !supported) return;

    // Fire if notification time is within ±2 minutes
    const WINDOW_MS = 120_000;

    const checkDue = async () => {
      const now = Date.now();
      const notifs = await buildScheduledNotifications(settings, WINDOW_MS);
      for (const n of notifs) {
        const diff = n.fireAt - now;
        if (diff >= -WINDOW_MS && diff <= WINDOW_MS) {
          if (!hasFiredToday(n.tag)) {
            markFiredToday(n.tag);
            // Show via SW — works from ANY page, background tab, or minimized window
            await showViaSW({ title: n.title, body: n.body, tag: n.tag, url: n.url ?? "/" });
            // Also add to in-app inbox
            void addToInboxApi({ type: "reminder", title: n.title, body: n.body, icon: "bell", color: "#4A90B8" });
          }
        }
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 30_000);
    return () => clearInterval(interval);
  }, [settings, permission, supported]);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.prayers) next.prayers = { ...prev.prayers, ...patch.prayers };
      saveSettings(next);
      syncSettingsToApi(next);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const perm = await requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;
    await registerSW();
    // Subscribe to server-side WebPush so notifications fire when app is closed
    void subscribeToPush();
    updateSettings({ enabled: true });
    return true;
  }, [updateSettings]);

  const disableNotifications = useCallback(() => {
    updateSettings({ enabled: false });
  }, [updateSettings]);

  return (
    <NotificationsContext.Provider value={{
      settings, permission, supported,
      updateSettings, enableNotifications, disableNotifications, reschedule,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
