import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import i18n, {
  getInitialLanguage,
  STORAGE_KEY_LANGUAGE,
  type SupportedLanguage,
} from '@/i18n';
import { getThemeColors, type Colors, type PalettePreset } from '@/theme';

import type { PaymentMethod } from '@/types';
import { PAYMENT_FEATURE_FLAGS } from '@/utils/payments';

/** Appearance preference. `system` follows the OS setting. */
export type AppearanceMode = 'light' | 'dark' | 'system';

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  title: string;
  subtitle: string;
  accountNumber?: string;
  bankName?: string;
  isDefault?: boolean;
  createdAt: string;
}

export const DEFAULT_SAVED_PAYMENT_METHODS: SavedPaymentMethod[] = [
  {
    id: 'pm-sim',
    type: 'SIMULATOR',
    title: 'Thanh toán mô phỏng (Demo Sandbox)',
    subtitle: 'Mô phỏng thanh toán tức thì phục vụ đồ án',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pm-sepay',
    type: 'BANK_TRANSFER',
    title: 'Chuyển khoản VietQR (Cổng SePay)',
    subtitle: 'MBBank · STK: 9876543210 (VietQR động)',
    accountNumber: '9876543210',
    bankName: 'MBBank',
    isDefault: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

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
  /** Preferred / default payment method for bookings. */
  preferredPaymentMethod: PaymentMethod;
  setPreferredPaymentMethod: (method: PaymentMethod) => void;
  savedPaymentMethods: SavedPaymentMethod[];
  addSavedPaymentMethod: (method: Omit<SavedPaymentMethod, 'id' | 'createdAt'>) => void;
  removeSavedPaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
}

export const STORAGE_KEY_APPEARANCE = 'chargeops_driver_appearance';
export const STORAGE_KEY_PALETTE = 'chargeops_driver_palette';
export const STORAGE_KEY_FAVORITES = 'chargeops_driver_favorites';
export const STORAGE_KEY_PREFERRED_PAYMENT_METHOD = 'chargeops_driver_preferred_payment_method';
export const STORAGE_KEY_SAVED_PAYMENT_METHODS = 'chargeops_driver_saved_payment_methods';

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

function getInitialPreferredPaymentMethod(): PaymentMethod {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_PREFERRED_PAYMENT_METHOD);
      if (saved) {
        const m = saved as PaymentMethod;
        if (m === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
          return 'SIMULATOR';
        }
        return m;
      }
    } catch {}
  }
  return 'SIMULATOR';
}

function getInitialSavedPaymentMethods(): SavedPaymentMethod[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_SAVED_PAYMENT_METHODS);
      if (saved) {
        const list = JSON.parse(saved) as SavedPaymentMethod[];
        if (!PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
          return list.map((m) => ({
            ...m,
            isDefault: m.type === 'SIMULATOR',
          }));
        }
        return list;
      }
    } catch {}
  }
  return DEFAULT_SAVED_PAYMENT_METHODS;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

/**
 * Holds user UI preferences (appearance, language, dynamic theme palette, favorites, payment methods).
 * Seamlessly resolves light, dark, OS system themes, and language across all components with persistent storage.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearanceMode>(getInitialAppearance);
  const [palette, setPaletteState] = useState<PalettePreset>(getInitialPalette);
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites);
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);
  const [preferredPaymentMethod, setPreferredPaymentMethodState] = useState<PaymentMethod>(getInitialPreferredPaymentMethod);
  const [savedPaymentMethods, setSavedPaymentMethodsState] = useState<SavedPaymentMethod[]>(getInitialSavedPaymentMethods);
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
        const savedPref = window.localStorage.getItem(STORAGE_KEY_PREFERRED_PAYMENT_METHOD);
        if (savedPref) {
          setPreferredPaymentMethodState(savedPref as PaymentMethod);
        }
        const savedPm = window.localStorage.getItem(STORAGE_KEY_SAVED_PAYMENT_METHODS);
        if (savedPm) {
          setSavedPaymentMethodsState(JSON.parse(savedPm));
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

      SecureStore.getItemAsync(STORAGE_KEY_PREFERRED_PAYMENT_METHOD).then((saved) => {
        if (saved) {
          const m = saved as PaymentMethod;
          if (m === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
            setPreferredPaymentMethodState('SIMULATOR');
          } else {
            setPreferredPaymentMethodState(m);
          }
        }
      }).catch(() => {});

      SecureStore.getItemAsync(STORAGE_KEY_SAVED_PAYMENT_METHODS).then((saved) => {
        if (saved) {
          try {
            const list = JSON.parse(saved) as SavedPaymentMethod[];
            if (!PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
              setSavedPaymentMethodsState(
                list.map((m) => ({
                  ...m,
                  isDefault: m.type === 'SIMULATOR',
                })),
              );
            } else {
              setSavedPaymentMethodsState(list);
            }
          } catch {}
        }
      }).catch(() => {});
    }
  }, []);

  const persistPaymentMethods = (methods: SavedPaymentMethod[], preferred: PaymentMethod) => {
    setSavedPaymentMethodsState(methods);
    setPreferredPaymentMethodState(preferred);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_SAVED_PAYMENT_METHODS, JSON.stringify(methods));
        window.localStorage.setItem(STORAGE_KEY_PREFERRED_PAYMENT_METHOD, preferred);
      } catch {}
    }
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync(STORAGE_KEY_SAVED_PAYMENT_METHODS, JSON.stringify(methods)).catch(() => {});
      SecureStore.setItemAsync(STORAGE_KEY_PREFERRED_PAYMENT_METHOD, preferred).catch(() => {});
    }
  };

  const setPreferredPaymentMethod = (method: PaymentMethod) => {
    if (method === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
      return;
    }
    const updated = savedPaymentMethods.map((m) => ({
      ...m,
      isDefault: m.type === method,
    }));
    persistPaymentMethods(updated, method);
  };

  const setDefaultPaymentMethod = (id: string) => {
    const target = savedPaymentMethods.find((m) => m.id === id);
    if (!target) return;
    if (target.type === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
      return;
    }
    const updated = savedPaymentMethods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    persistPaymentMethods(updated, target.type);
  };

  const addSavedPaymentMethod = (item: Omit<SavedPaymentMethod, 'id' | 'createdAt'>) => {
    if (!PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD) {
      return;
    }
    const newId = `pm-${Date.now()}`;
    const newMethod: SavedPaymentMethod = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    let updated: SavedPaymentMethod[];
    let newPreferred = preferredPaymentMethod;
    if (item.isDefault) {
      updated = [...savedPaymentMethods.map((m) => ({ ...m, isDefault: false })), newMethod];
      newPreferred = item.type;
    } else {
      updated = [...savedPaymentMethods, newMethod];
    }
    persistPaymentMethods(updated, newPreferred);
  };

  const removeSavedPaymentMethod = (id: string) => {
    if (!PAYMENT_FEATURE_FLAGS.ENABLE_PAYMENT_METHODS_CRUD) {
      return;
    }
    const remaining = savedPaymentMethods.filter((m) => m.id !== id);
    if (remaining.length === 0) {
      persistPaymentMethods(DEFAULT_SAVED_PAYMENT_METHODS, 'SIMULATOR');
      return;
    }
    let newPreferred = preferredPaymentMethod;
    const wasDefault = savedPaymentMethods.find((m) => m.id === id)?.isDefault;
    if (wasDefault) {
      remaining[0].isDefault = true;
      newPreferred = remaining[0].type;
    }
    persistPaymentMethods(remaining, newPreferred);
  };

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
      preferredPaymentMethod,
      setPreferredPaymentMethod,
      savedPaymentMethods,
      addSavedPaymentMethod,
      removeSavedPaymentMethod,
      setDefaultPaymentMethod,
    }),
    [
      appearance,
      palette,
      language,
      themeColors,
      isDark,
      favorites,
      preferredPaymentMethod,
      savedPaymentMethods,
    ],
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
