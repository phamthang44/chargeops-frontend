import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Theme is a plain CSS-variable swap (see packages/tokens/tokens.css) —
 * setting `data-theme` on <html> repaints every `bg-surface`/`text-ink`/etc.
 * utility with no `dark:` variant classes anywhere in the app. main.tsx sets
 * the attribute synchronously before React mounts (avoids a flash of the
 * wrong theme); this provider just keeps React state and localStorage in
 * sync with whatever main.tsx already applied.
 */
export const SUPPORTED_THEMES = ['light', 'dark'] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];

const STORAGE_KEY = 'chargeops.theme';

function isTheme(value: string | null | undefined): value is Theme {
  return (SUPPORTED_THEMES as readonly string[]).includes(value ?? '');
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const applied = document.documentElement.dataset.theme;
    return isTheme(applied) ? applied : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (isTheme(detail)) {
        setTheme(detail);
      }
    };
    window.addEventListener('chargeops-theme-change', handleThemeChange);
    return () => window.removeEventListener('chargeops-theme-change', handleThemeChange);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
