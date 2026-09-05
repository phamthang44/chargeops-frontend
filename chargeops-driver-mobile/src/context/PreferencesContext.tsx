import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import i18n, {
  getInitialLanguage,
  STORAGE_KEY_LANGUAGE,
  type SupportedLanguage,
} from '@/i18n';
import { getThemeColors, type Colors, type PalettePreset } from '@/theme';

/** Appearance preference. `system` follows the OS setting. */
export type AppearanceMode = 'light' | 'dark' | 'system';

interface PreferencesContextValue {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  palette: PalettePreset;
  setPalette: (preset: PalettePreset) => void;
  language: SupportedLanguage;
  setLanguage: (lng: SupportedLanguage) => void;
  themeColors: Colors;
  isDark: boolean;
  /** IDs of stations the driver has saved/favorited. */
  favorites: string[];
  toggleFavorite: (stationId: string) => void;
  isFavorite: (stationId: string) => boolean;
}

export const STORAGE_KEY_APPEARANCE = 'chargeops_driver_appearance';
export const STORAGE_KEY_PALETTE = 'chargeops_driver_palette';
export const STORAGE_KEY_FAVORITES = 'chargeops_driver_favorites';

function getInitialAppearance(): AppearanceMode {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_APPEARANCE);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {}
  }
  return 'light';
}

function getInitialPalette(): PalettePreset {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_PALETTE);
      if (saved === 'balanced' || saved === 'classic') {
        return saved;
      }
    } catch {}
  }
  return 'balanced';
}

function getInitialFavorites(): string[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return [];
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

/**
 * Holds user UI preferences (appearance, language, dynamic theme palette, favorites).
 * Seamlessly resolves light, dark, OS system themes, and language across all components with persistent storage.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearanceMode>(getInitialAppearance);
  const [palette, setPaletteState] = useState<PalettePreset>(getInitialPalette);
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites);
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);
  const systemScheme = useColorScheme();

  // Load and hydrate preferences across Web (localStorage) and Native (SecureStore)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedApp = window.localStorage.getItem(STORAGE_KEY_APPEARANCE);
        if (savedApp === 'light' || savedApp === 'dark' || savedApp === 'system') {
          setAppearanceState(savedApp);
        }
        const savedPal = window.localStorage.getItem(STORAGE_KEY_PALETTE);
        if (savedPal === 'balanced' || savedPal === 'classic') {
          setPaletteState(savedPal);
        }
        const savedLng = window.localStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (savedLng === 'vi' || savedLng === 'en') {
          setLanguageState(savedLng);
          if (i18n.language !== savedLng) {
            i18n.changeLanguage(savedLng);
          }
        }
        const savedFavs = window.localStorage.getItem(STORAGE_KEY_FAVORITES);
        if (savedFavs) {
          setFavorites(JSON.parse(savedFavs));
        }
      } catch {}
    }

    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync(STORAGE_KEY_APPEARANCE).then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setAppearanceState(saved);
        }
      }).catch(() => {});

      SecureStore.getItemAsync(STORAGE_KEY_PALETTE).then((saved) => {
        if (saved === 'balanced' || saved === 'classic') {
          setPaletteState(saved);
        }
      }).catch(() => {});

      SecureStore.getItemAsync(STORAGE_KEY_LANGUAGE).then((saved) => {
        if (saved === 'vi' || saved === 'en') {
          setLanguageState(saved);
          if (i18n.language !== saved) {
            i18n.changeLanguage(saved);
          }
        }
      }).catch(() => {});

      SecureStore.getItemAsync(STORAGE_KEY_FAVORITES).then((saved) => {
        if (saved) {
          try {
            setFavorites(JSON.parse(saved));
          } catch {}
        }
      }).catch(() => {});
    }
  }, []);

  const setAppearance = (mode: AppearanceMode) => {
    setAppearanceState(mode);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_APPEARANCE, mode);
      } catch {}
    }
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync(STORAGE_KEY_APPEARANCE, mode).catch(() => {});
    }
  };

  const setPalette = (preset: PalettePreset) => {
    setPaletteState(preset);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_PALETTE, preset);
      } catch {}
    }
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync(STORAGE_KEY_PALETTE, preset).catch(() => {});
    }
  };

  const setLanguage = (lng: SupportedLanguage) => {
    setLanguageState(lng);
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_LANGUAGE, lng);
      } catch {}
    }
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync(STORAGE_KEY_LANGUAGE, lng).catch(() => {});
    }
  };

  const toggleFavorite = (stationId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(stationId) ? prev.filter((f) => f !== stationId) : [...prev, stationId];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next));
        } catch {}
      }
      if (Platform.OS !== 'web') {
        SecureStore.setItemAsync(STORAGE_KEY_FAVORITES, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  };

  const themeColors = useMemo(
    () => getThemeColors(appearance, systemScheme, palette),
    [appearance, systemScheme, palette],
  );

  const isDark = useMemo(
    () => (appearance === 'dark' ? true : appearance === 'light' ? false : systemScheme === 'dark'),
    [appearance, systemScheme],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      appearance,
      setAppearance,
      palette,
      setPalette,
      language,
      setLanguage,
      themeColors,
      isDark,
      favorites,
      toggleFavorite,
      isFavorite: (id) => favorites.includes(id),
    }),
    [appearance, palette, language, themeColors, isDark, favorites],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** Access UI preferences and their setters. */
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
