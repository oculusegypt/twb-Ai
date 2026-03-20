import AsyncStorage from "@react-native-async-storage/async-storage";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const BASE_URL = DOMAIN
  ? `https://${DOMAIN}/api`
  : "http://localhost:8080/api";

const SESSION_KEY = "tawbah_session_id";

export async function getSessionId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 9);
      await AsyncStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "local-" + Date.now().toString(36);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const sessionId = await getSessionId();
  const url = new URL(`${BASE_URL}${path}`);

  if (!options?.method || options.method === "GET") {
    url.searchParams.set("sessionId", sessionId);
  }

  const body =
    options?.body && typeof options.body === "string"
      ? JSON.stringify({ ...JSON.parse(options.body), sessionId })
      : options?.body;

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function formatDate(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().split("T")[0]!;
}
