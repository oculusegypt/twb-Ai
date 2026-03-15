import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";
import type { 
  UserProgress, 
  HabitEntry, 
  DhikrCount,
  UpdateUserProgressRequest,
  CreateCovenantRequest,
  CompleteHabitRequest,
  IncrementDhikrRequest
} from "@workspace/api-client-react";

// The generated orval API client missed `sessionId` as a parameter for GET requests.
// We write custom fetchers here to ensure we pass the sessionId correctly.

export function useAppUserProgress() {
  return useQuery({
    queryKey: ["/api/user/progress"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const res = await fetch(`/api/user/progress?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) {
        if (res.status === 404) return null; // Expected if user has no progress yet
        throw new Error("Failed to fetch user progress");
      }
      return res.json() as Promise<UserProgress>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAppHabits() {
  return useQuery({
    queryKey: ["/api/habits"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/habits?sessionId=${encodeURIComponent(sessionId)}&date=${today}`);
      if (!res.ok) throw new Error("Failed to fetch habits");
      return res.json() as Promise<HabitEntry[]>;
    },
  });
}

export function useAppDhikrCount() {
  return useQuery({
    queryKey: ["/api/dhikr/count"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/dhikr/count?sessionId=${encodeURIComponent(sessionId)}&date=${today}`);
      if (!res.ok) throw new Error("Failed to fetch dhikr count");
      return res.json() as Promise<DhikrCount>;
    },
  });
}

// Mutations using standard fetch to maintain consistency with the GET hooks and handle cache invalidation centrally

export function useAppUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<UpdateUserProgressRequest, "sessionId">) => {
      const payload: UpdateUserProgressRequest = {
        ...data,
        sessionId: getSessionId(),
      };
      const res = await fetch(`/api/user/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return res.json() as Promise<UserProgress>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
  });
}

export function useAppCreateCovenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateCovenantRequest, "sessionId">) => {
      const payload: CreateCovenantRequest = {
        ...data,
        sessionId: getSessionId(),
      };
      const res = await fetch(`/api/user/covenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to sign covenant");
      return res.json() as Promise<UserProgress>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
  });
}

export function useAppCompleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CompleteHabitRequest, "sessionId">) => {
      const payload: CompleteHabitRequest = {
        ...data,
        sessionId: getSessionId(),
      };
      const res = await fetch(`/api/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update habit");
      return res.json() as Promise<HabitEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });
}

export function useAppIncrementDhikr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<IncrementDhikrRequest, "sessionId">) => {
      const payload: IncrementDhikrRequest = {
        ...data,
        sessionId: getSessionId(),
      };
      const res = await fetch(`/api/dhikr/increment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to increment dhikr");
      return res.json() as Promise<DhikrCount>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dhikr/count"] });
    },
  });
}
