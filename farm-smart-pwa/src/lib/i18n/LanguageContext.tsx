// src/lib/i18n/LanguageContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { FarmerProfile } from "@/types";
import { alertTranslations, authTranslations, commonTranslations, pageTranslations, translations, uiTranslations, workflowTranslations, type Lang, type TranslationKey } from "./translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  t: (key: string | TranslationKey) => string;
}

const FONT_SCALE: Record<Lang, number> = {
  en: 1.125,
  hi: 1.125,
  kn: 1.125,
  mr: 1.125,
  ta: 1.125,
  pa: 1.125,
  bn: 1.125,
  te: 1.125,
  gu: 1.125,
};

const isLang = (value: unknown): value is Lang => typeof value === "string" && value in translations;

const getInitialLanguage = (): Lang => {
  if (typeof window === "undefined") return "en";

  const savedAppLang = localStorage.getItem("app_lang");
  if (savedAppLang && isLang(savedAppLang)) return savedAppLang;

  const savedProfile = localStorage.getItem("farmer_profile");
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile) as Partial<FarmerProfile>;
      if (isLang(parsed.preferred_language)) return parsed.preferred_language;
    } catch {
      // Ignore malformed saved profile data and fall back to default language.
    }
  }

  return "en";
};

const getInitialDarkMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("app_theme") === "dark";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLanguage);
  const [darkMode, setDarkModeState] = useState(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.style.setProperty("--app-font-scale", String(FONT_SCALE[lang] ?? 1));
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = darkMode ? "dark" : "light";
    root.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const setLang = (newLang: Lang) => {
    if (!isLang(newLang)) return;

    setLangState(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
    localStorage.setItem("app_theme", enabled ? "dark" : "light");
  };

  const t = (key: string | TranslationKey) =>
    uiTranslations[lang][key] ?? commonTranslations[lang][key] ?? workflowTranslations[lang][key] ?? alertTranslations[lang][key] ?? authTranslations[lang][key] ?? pageTranslations[lang][key] ?? translations[lang][key as TranslationKey] ?? translations.en[key as TranslationKey] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, darkMode, setDarkMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}