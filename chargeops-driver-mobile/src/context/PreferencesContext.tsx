import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Appearance preference. `system` follows the OS setting. */
export type AppearanceMode = 'light' | 'dark' | 'system';

interface PreferencesContextValue {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

/**
 * Holds user UI preferences (appearance, …).
 * Skeleton scope: in-memory only (resets on relaunch), mirroring AuthContext.
 * LATER: persist via expo-secure-store / AsyncStorage, and feed `appearance`
 * into a theme provider so the whole app repaints for dark mode.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<AppearanceMode>('system');

  const value = useMemo<PreferencesContextValue>(
    () => ({ appearance, setAppearance }),
    [appearance],
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
