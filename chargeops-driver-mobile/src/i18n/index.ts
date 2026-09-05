import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import en from './locales/en.json';
import vi from './locales/vi.json';

/**
 * App i18n setup.
 *
 * Persists user's selected language across sessions & F5 reloads via localStorage
 * on Web and SecureStore on Native devices. Defaults to Vietnamese ('vi') on first boot.
 */
export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'vi';
export const STORAGE_KEY_LANGUAGE = 'chargeops_driver_language';

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_LANGUAGE);
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    } catch {}
  }
  return DEFAULT_LANGUAGE;
}

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

const initialLng = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

// Automatically persist any language switch initiated anywhere in the app
i18n.on('languageChanged', (lng) => {
  if (lng === 'vi' || lng === 'en') {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_LANGUAGE, lng);
      } catch {}
    }
    if (Platform.OS !== 'web') {
      SecureStore.setItemAsync(STORAGE_KEY_LANGUAGE, lng).catch(() => {});
    }
  }
});

// Native async hydration from SecureStore
if (Platform.OS !== 'web') {
  SecureStore.getItemAsync(STORAGE_KEY_LANGUAGE).then((saved) => {
    if (saved && (saved === 'vi' || saved === 'en') && i18n.language !== saved) {
      i18n.changeLanguage(saved);
    }
  }).catch(() => {});
}

export default i18n;

