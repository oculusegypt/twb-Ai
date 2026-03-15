import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  StoredProgress,
  StoredHabit,
  StoredDhikr,
  getProgress,
  saveProgress,
  getHabits,
  saveHabits,
  getDhikr,
  saveDhikr,
  getSessionId,
  todayStr,
} from "@/lib/storage";

interface AppContextType {
  sessionId: string;
  progress: StoredProgress | null;
  habits: StoredHabit[];
  dhikr: StoredDhikr;
  loading: boolean;
  signCovenant: (sinCategory: string) => Promise<void>;
  completeFirstDayTasks: () => Promise<void>;
  toggleHabit: (habitKey: string) => Promise<void>;
  incrementDhikr: (type: "istighfar" | "tasbih" | "sayyid") => Promise<void>;
  resetDhikr: (type: "istighfar" | "tasbih" | "sayyid") => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [progress, setProgress] = useState<StoredProgress | null>(null);
  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [dhikr, setDhikr] = useState<StoredDhikr>({ date: todayStr(), istighfar: 0, tasbih: 0, sayyid: 0 });
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const sid = await getSessionId();
    setSessionId(sid);
    const prog = await getProgress();
    setProgress(prog);
    const today = todayStr();
    const isFirstDay = !prog?.firstDayTasksCompleted;
    const h = await getHabits(today, isFirstDay);
    setHabits(h);
    const d = await getDhikr(today);
    setDhikr(d);
  }, []);

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  const signCovenant = useCallback(async (sinCategory: string) => {
    const sid = sessionId || await getSessionId();
    const now = new Date().toISOString();
    const newProgress: StoredProgress = {
      sessionId: sid,
      sinCategory,
      covenantSigned: true,
      covenantDate: now,
      currentPhase: 2,
      day40Progress: 0,
      firstDayTasksCompleted: false,
      streakDays: 0,
      lastActiveDate: todayStr(),
    };
    await saveProgress(newProgress);
    setProgress(newProgress);
    const h = await getHabits(todayStr(), true);
    setHabits(h);
  }, [sessionId]);

  const completeFirstDayTasks = useCallback(async () => {
    if (!progress) return;
    const updated = { ...progress, firstDayTasksCompleted: true, currentPhase: 3, day40Progress: 1 };
    await saveProgress(updated);
    setProgress(updated);
    const today = todayStr();
    const h = await getHabits(today, false);
    setHabits(h);
  }, [progress]);

  const toggleHabit = useCallback(async (habitKey: string) => {
    const today = todayStr();
    const updated = habits.map((h) =>
      h.habitKey === habitKey ? { ...h, completed: !h.completed } : h
    );
    await saveHabits(today, updated);
    setHabits(updated);

    if (!progress?.firstDayTasksCompleted && updated.every((h) => h.completed)) {
      await completeFirstDayTasks();
    }
  }, [habits, progress, completeFirstDayTasks]);

  const incrementDhikr = useCallback(async (type: "istighfar" | "tasbih" | "sayyid") => {
    const today = todayStr();
    const updated = { ...dhikr, [type]: dhikr[type] + 1 };
    await saveDhikr(today, updated);
    setDhikr(updated);
  }, [dhikr]);

  const resetDhikr = useCallback(async (type: "istighfar" | "tasbih" | "sayyid") => {
    const today = todayStr();
    const updated = { ...dhikr, [type]: 0 };
    await saveDhikr(today, updated);
    setDhikr(updated);
  }, [dhikr]);

  return (
    <AppContext.Provider value={{
      sessionId,
      progress,
      habits,
      dhikr,
      loading,
      signCovenant,
      completeFirstDayTasks,
      toggleHabit,
      incrementDhikr,
      resetDhikr,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
