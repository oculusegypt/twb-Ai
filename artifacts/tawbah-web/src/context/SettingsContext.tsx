import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { type Lang, getTranslations, type Translations } from "@/lib/translations";

type Theme = "light" | "dark";

interface SettingsContextType {
  lang: Lang;
  theme: Theme;
  t: Translations;
  dir: "rtl" | "ltr";
  toggleLang: () => void;
  toggleTheme: () => void;
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

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("tawbah_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("tawbah_lang", lang);
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <SettingsContext.Provider
      value={{
        lang,
        theme,
        t: getTranslations(lang),
        dir: lang === "ar" ? "rtl" : "ltr",
        toggleLang,
        toggleTheme,
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
