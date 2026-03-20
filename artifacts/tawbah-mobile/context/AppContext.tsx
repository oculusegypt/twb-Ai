import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch, formatDate } from "@/lib/api";

interface UserProgress {
  id?: number;
  sessionId: string;
  sinCategory: string | null;
  covenantSigned: boolean;
  covenantDate: string | null;
  currentPhase: string;
  day40Progress: number;
  firstDayTasksCompleted: boolean;
  streakDays: number;
  lastActiveDate: string | null;
  createdAt?: string;
}

interface LiveStats {
  today: { tawbah: number; dhikr: number; dua: number; quran: number };
  total: number;
  thisWeek: number;
}

interface AppContextValue {
  progress: UserProgress | null;
  liveStats: LiveStats | null;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  signCovenant: (sinCategory: string) => Promise<void>;
  updateProgress: (patch: Partial<UserProgress>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PROGRESS: UserProgress = {
  sessionId: "",
  sinCategory: null,
  covenantSigned: false,
  covenantDate: null,
  currentPhase: "البداية",
  day40Progress: 0,
  firstDayTasksCompleted: false,
  streakDays: 0,
  lastActiveDate: null,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    try {
      const data = await apiFetch<UserProgress>("/user/progress");
      setProgress(data);
    } catch {
      const cached = await AsyncStorage.getItem("tawbah_progress_cache");
      if (cached) setProgress(JSON.parse(cached));
      else setProgress({ ...DEFAULT_PROGRESS, sessionId: "" });
    }
  }, []);

  const fetchLiveStats = useCallback(async () => {
    try {
      const data = await apiFetch<LiveStats>("/stats/live");
      setLiveStats(data);
    } catch {
      setLiveStats({ today: { tawbah: 0, dhikr: 0, dua: 0, quran: 0 }, total: 0, thisWeek: 0 });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([refreshProgress(), fetchLiveStats()]);
      setIsLoading(false);
    };
    init();
  }, [refreshProgress, fetchLiveStats]);

  useEffect(() => {
    if (progress) {
      AsyncStorage.setItem("tawbah_progress_cache", JSON.stringify(progress));
    }
  }, [progress]);

  const signCovenant = useCallback(
    async (sinCategory: string) => {
      const data = await apiFetch<UserProgress>("/user/covenant", {
        method: "POST",
        body: JSON.stringify({ sinCategory, covenantDate: formatDate() }),
      });
      setProgress(data);
      await apiFetch("/stats/event", {
        method: "POST",
        body: JSON.stringify({ type: "tawbah" }),
      });
    },
    []
  );

  const updateProgress = useCallback(
    async (patch: Partial<UserProgress>) => {
      const data = await apiFetch<UserProgress>("/user/progress", {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setProgress(data);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        progress,
        liveStats,
        isLoading,
        refreshProgress,
        signCovenant,
        updateProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
