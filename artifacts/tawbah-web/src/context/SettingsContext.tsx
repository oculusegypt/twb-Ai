import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type Lang, getTranslations, type Translations } from "@/lib/translations";

type Theme = "light" | "dark";

export type QuranReciter = {
  id: string;
  name: string;
  nameAr: string;
};

export const QURAN_RECITERS: QuranReciter[] = [
  { id: "ar.alafasy",            name: "Mishary Rashid Alafasy",     nameAr: "مشاري راشد العفاسي" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais",      nameAr: "عبد الرحمن السديس" },
  { id: "ar.mahermuaiqly",       name: "Maher Al Muaiqly",           nameAr: "ماهر المعيقلي" },
  { id: "ar.husary",             name: "Mahmoud Khalil Al-Husary",   nameAr: "محمود خليل الحصري" },
  { id: "ar.minshawi",           name: "Mohammed Siddiq Al-Minshawi",nameAr: "محمد صديق المنشاوي" },
  { id: "ar.abdulsamad",         name: "Abdul Samad",                nameAr: "عبد الباسط عبد الصمد" },
];

interface SettingsContextType {
  lang: Lang;
  theme: Theme;
  t: Translations;
  dir: "rtl" | "ltr";
  autoPlayBotAudio: boolean;
  autoPlayQuran: boolean;
  quranReciterId: string;
  toggleLang: () => void;
  toggleTheme: () => void;
  setAutoPlayBotAudio: (v: boolean) => void;
  setAutoPlayQuran: (v: boolean) => void;
  setQuranReciterId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("tawbah_lang") as Lang) || "ar";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("tawbah_theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [autoPlayBotAudio, setAutoPlayBotAudioState] = useState<boolean>(() => {
    const stored = localStorage.getItem("tawbah_autoplay_bot");
    return stored === null ? true : stored === "true";
  });
  const [autoPlayQuran, setAutoPlayQuranState] = useState<boolean>(() => {
    const stored = localStorage.getItem("tawbah_autoplay_quran");
    return stored === null ? true : stored === "true";
  });
  const [quranReciterId, setQuranReciterIdState] = useState<string>(() => {
    return localStorage.getItem("tawbah_reciter") || "ar.alafasy";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("tawbah_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("tawbah_lang", lang);
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setAutoPlayBotAudio = (v: boolean) => {
    setAutoPlayBotAudioState(v);
    localStorage.setItem("tawbah_autoplay_bot", String(v));
  };
  const setAutoPlayQuran = (v: boolean) => {
    setAutoPlayQuranState(v);
    localStorage.setItem("tawbah_autoplay_quran", String(v));
  };
  const setQuranReciterId = (id: string) => {
    setQuranReciterIdState(id);
    localStorage.setItem("tawbah_reciter", id);
  };

  return (
    <SettingsContext.Provider
      value={{
        lang, theme, t: getTranslations(lang), dir: lang === "ar" ? "rtl" : "ltr",
        autoPlayBotAudio, autoPlayQuran, quranReciterId,
        toggleLang, toggleTheme,
        setAutoPlayBotAudio, setAutoPlayQuran, setQuranReciterId,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
