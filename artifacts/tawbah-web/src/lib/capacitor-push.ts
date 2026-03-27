import { isNativeApp, getApiBase } from "./api-base";

type PushNotificationsPlugin = {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (
    event: string,
    callback: (data: unknown) => void
  ) => Promise<{ remove: () => void }>;
  getDeliveredNotifications: () => Promise<{ notifications: unknown[] }>;
  removeDeliveredNotifications: (options: { notifications: unknown[] }) => Promise<void>;
};

let _pushPlugin: PushNotificationsPlugin | null = null;

async function getPushPlugin(): Promise<PushNotificationsPlugin | null> {
  if (!isNativeApp()) return null;
  if (_pushPlugin) return _pushPlugin;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    _pushPlugin = PushNotifications as unknown as PushNotificationsPlugin;
    return _pushPlugin;
  } catch {
    return null;
  }
}

export interface CapacitorPushHandlers {
  onToken?: (token: string) => void;
  onNotification?: (title: string, body: string, data?: Record<string, string>) => void;
  onError?: (error: string) => void;
}

export async function initCapacitorPush(handlers: CapacitorPushHandlers = {}): Promise<boolean> {
  const plugin = await getPushPlugin();
  if (!plugin) return false;

  try {
    const permResult = await plugin.requestPermissions();
    if (permResult.receive !== "granted") {
      handlers.onError?.("permission_denied");
      return false;
    }

    await plugin.register();

    await plugin.addListener("registration", (token: unknown) => {
      const tokenStr = (token as { value: string }).value;
      handlers.onToken?.(tokenStr);
      try {
        localStorage.setItem("fcm_token", tokenStr);
        void sendTokenToServer(tokenStr);
      } catch {}
    });

    await plugin.addListener("registrationError", (err: unknown) => {
      handlers.onError?.((err as { error: string }).error || "unknown_error");
    });

    await plugin.addListener("pushNotificationReceived", (notification: unknown) => {
      const n = notification as { title?: string; body?: string; data?: Record<string, string> };
      handlers.onNotification?.(n.title ?? "دليل التوبة", n.body ?? "", n.data);
    });

    await plugin.addListener("pushNotificationActionPerformed", (action: unknown) => {
      const a = action as { notification?: { data?: { url?: string } } };
      const url = a.notification?.data?.url;
      if (url && url !== "/" && typeof window !== "undefined") {
        window.location.hash = url;
      }
    });

    return true;
  } catch {
    return false;
  }
}

async function sendTokenToServer(token: string): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${getApiBase()}/push/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, token, platform: "android" }),
    });
  } catch {}
}

export async function getCapacitorPermission(): Promise<"granted" | "denied" | "default"> {
  const plugin = await getPushPlugin();
  if (!plugin) return "denied";
  try {
    const result = await plugin.requestPermissions();
    if (result.receive === "granted") return "granted";
    if (result.receive === "denied") return "denied";
    return "default";
  } catch {
    return "denied";
  }
}

export async function isCapacitorPushAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await import("@capacitor/push-notifications");
    return true;
  } catch {
    return false;
  }
}
