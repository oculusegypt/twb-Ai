import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  getUnreadCount,
  seedDailyNotifications,
  loadNotifications,
  type AppNotification,
} from "@/lib/app-notifications";

interface AppNotificationsContextValue {
  unreadCount: number;
  refreshUnreadCount: () => void;
  notifications: AppNotification[];
  reloadNotifications: () => void;
}

const AppNotificationsContext = createContext<AppNotificationsContextValue | null>(null);

export function AppNotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());

  const refreshUnreadCount = useCallback(() => {
    setUnreadCount(getUnreadCount());
  }, []);

  const reloadNotifications = useCallback(() => {
    setNotifications(loadNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    // Seed using locally stored progress data
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    const streakStr = localStorage.getItem(`streak_${sessionId}`);
    const progressStr = localStorage.getItem(`day40_${sessionId}`);
    const covenantStr = localStorage.getItem(`covenant_${sessionId}`);

    const streakDays = streakStr ? parseInt(streakStr) : 0;
    const day40Progress = progressStr ? parseInt(progressStr) : 0;
    const covenantSigned = covenantStr === "true";

    seedDailyNotifications(streakDays, day40Progress, covenantSigned);
    reloadNotifications();
  }, [reloadNotifications]);

  return (
    <AppNotificationsContext.Provider value={{ unreadCount, refreshUnreadCount, notifications, reloadNotifications }}>
      {children}
    </AppNotificationsContext.Provider>
  );
}

export function useAppNotifications() {
  const ctx = useContext(AppNotificationsContext);
  if (!ctx) throw new Error("useAppNotifications must be used inside AppNotificationsProvider");
  return ctx;
}
