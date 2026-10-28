"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { vi } from "./dictionaries/vi";
import { en } from "./dictionaries/en";
import type { Locale, Dictionary, I18nContextType } from "./types";

const STORAGE_KEY = "chargeops_locale";

const dictionaries: Record<Locale, Dictionary> = {
  vi,
  en,
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  // Read saved locale on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "vi" || saved === "en") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        return;
      }
      // If user browser language defaults to English and not explicitly set
      const browserLang = navigator.language?.toLowerCase() ?? "";
      if (browserLang.startsWith("en")) {
        setLocaleState("en");
        document.documentElement.lang = "en";
      }
    } catch {
      // Ignore localStorage access failures in private browsing
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "vi" ? "en" : "vi");
  };

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale,
      t: dictionaries[locale] || vi,
      setLocale,
      toggleLocale,
    }),
    [locale]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for components mounted outside provider (e.g. testing)
    return {
      locale: "vi" as Locale,
      t: vi,
      setLocale: () => {},
      toggleLocale: () => {},
    };
  }
  return context;
}

export function useLocale() {
  const { locale, setLocale, toggleLocale } = useTranslation();
  return { locale, setLocale, toggleLocale };
}
