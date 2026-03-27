declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export function isNativeApp(): boolean {
  return typeof window !== "undefined" &&
    typeof window.Capacitor !== "undefined" &&
    window.Capacitor.isNativePlatform();
}

export function getApiBase(): string {
  if (isNativeApp()) {
    const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (fromEnv) return fromEnv;
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("tawbah_api_base")
      : null;
    if (stored) return stored;
    return "https://tawbah.replit.app/api";
  }
  return "/api";
}

export const API_BASE = getApiBase();
