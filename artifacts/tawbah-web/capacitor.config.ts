import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aiservx.tawbah",
  appName: "دليل التوبة النصوح",

  webDir: "dist/public",

  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      "api.alquran.cloud",
      "cdn.islamic.network",
      "everyayah.com",
      "api.aladhan.com",
      "quran.com",
      "*.replit.app",
      "*.replit.dev",
    ],
  },

  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#0d1117",
    loggingBehavior: "none",
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    Camera: {},
  },
};

export default config;
