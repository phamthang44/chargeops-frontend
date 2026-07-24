import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getThemeColors, type Colors } from '@/theme';

/** Appearance preference. `system` follows the OS setting. */
export type AppearanceMode = 'light' | 'dark' | 'system';

interface PreferencesContextValue {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  themeColors: Colors;
  isDark: boolean;
  /** IDs of stations the driver has saved/favorited. */
  favorites: string[];
  toggleFavorite: (stationId: string) => void;
  isFavorite: (stationId: string) => boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

/**
 * Holds user UI preferences (appearance, dynamic theme palette, favorites).
 * Seamlessly resolves light, dark, and OS system themes across all components.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<AppearanceMode>('system');
  const [favorites, setFavorites] = useState<string[]>([]);
  const systemScheme = useColorScheme();

  const themeColors = useMemo(
    () => getThemeColors(appearance, systemScheme),
    [appearance, systemScheme],
  );

  const isDark = useMemo(
    () => (appearance === 'dark' ? true : appearance === 'light' ? false : systemScheme === 'dark'),
    [appearance, systemScheme],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      appearance,
      setAppearance,
      themeColors,
      isDark,
      favorites,
      toggleFavorite: (id) =>
        setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])),
      isFavorite: (id) => favorites.includes(id),
    }),
    [appearance, themeColors, isDark, favorites],
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
