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
  clearAll,
} from "@/lib/notifications";

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

  // Register SW on mount
  useEffect(() => {
    if (!supported) return;
    registerSW().then(() => {
      setPermission(getPermission());
    });
  }, [supported]);

  // Reschedule whenever settings change (if enabled)
  const reschedule = useCallback(async () => {
    const fresh = loadSettings();
    if (fresh.enabled && getPermission() === "granted") {
      await scheduleAll(fresh);
    }
  }, []);

  useEffect(() => {
    reschedule();
  }, [settings, reschedule]);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Deep merge prayers object
      if (patch.prayers) next.prayers = { ...prev.prayers, ...patch.prayers };
      saveSettings(next);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const perm = await requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;
    await registerSW();
    updateSettings({ enabled: true });
    return true;
  }, [updateSettings]);

  const disableNotifications = useCallback(() => {
    clearAll();
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
