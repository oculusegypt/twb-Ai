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

// ── Quran helpers ─────────────────────────────────────────────────────────────
// On native (Android), we bypass our proxy and call external APIs directly
// because: 1) No CORS restrictions in Capacitor WebView, 2) Faster, 3) Works offline from server

const SURAH_LENGTHS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,
  98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,
  75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,
  36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

function globalToSurahAyah(global: number): [number, number] {
  let remaining = global;
  for (let i = 0; i < SURAH_LENGTHS.length; i++) {
    const len = SURAH_LENGTHS[i]!;
    if (remaining <= len) return [i + 1, remaining];
    remaining -= len;
  }
  return [114, remaining];
}

function pad3(n: number) { return String(n).padStart(3, "0"); }

type IslamicConfig = { type: "islamic"; bitrate: number };
type EveryayahConfig = { type: "everyayah"; folder: string };
type ReciterConfig = IslamicConfig | EveryayahConfig;

const NATIVE_RECITER_CONFIG: Record<string, ReciterConfig> = {
  "ar.alafasy":            { type: "islamic", bitrate: 128 },
  "ar.mahermuaiqly":       { type: "islamic", bitrate: 128 },
  "ar.abdurrahmaansudais": { type: "islamic", bitrate: 192 },
  "ar.saoodshuraym":       { type: "islamic", bitrate: 64  },
  "ar.shaatree":           { type: "islamic", bitrate: 128 },
  "ar.saadalghamdi":       { type: "everyayah", folder: "Ghamadi_40kbps" },
  "ar.hanirifai":          { type: "islamic", bitrate: 192 },
  "ar.husary":             { type: "islamic", bitrate: 128 },
  "ar.minshawi":           { type: "islamic", bitrate: 128 },
  "ar.abdulsamad":         { type: "islamic", bitrate: 64  },
  "ar.ahmedajamy":         { type: "islamic", bitrate: 128 },
  "ar.muhammadjibreel":    { type: "islamic", bitrate: 128 },
};

/**
 * Returns the correct audio URL for a Quran ayah.
 * On native Android: returns external CDN URL directly (no proxy needed, no CORS)
 * On web: returns the proxy URL to avoid CORS
 */
export function getAudioUrl(reciterId: string, globalAyah: number): string {
  if (isNativeApp()) {
    const config = NATIVE_RECITER_CONFIG[reciterId] ?? { type: "islamic", bitrate: 128 };
    if (config.type === "everyayah") {
      const [surah, ayah] = globalToSurahAyah(globalAyah);
      return `https://everyayah.com/data/${config.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
    }
    return `https://cdn.islamic.network/quran/audio/${config.bitrate}/${reciterId}/${globalAyah}.mp3`;
  }
  return `/api/audio-proxy/quran/${reciterId}/${globalAyah}.mp3`;
}

/**
 * Returns the correct URL to fetch Quran surah data (Uthmani text).
 * On native: calls api.alquran.cloud directly
 * On web: goes through our proxy (avoids CORS)
 */
export function getQuranSurahUrl(surahId: number, edition = "quran-uthmani"): string {
  if (isNativeApp()) {
    return `https://api.alquran.cloud/v1/surah/${surahId}/${edition}`;
  }
  if (edition === "quran-uthmani") {
    return `/api/quran/surah/${surahId}`;
  }
  return `https://api.alquran.cloud/v1/surah/${surahId}/${edition}`;
}
