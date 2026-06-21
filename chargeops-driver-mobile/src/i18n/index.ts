import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

/**
 * App i18n setup.
 *
 * UI language ALWAYS starts in Vietnamese — ChargeOps is built for Vietnamese
 * drivers, so we intentionally ignore the device locale on launch (a phone set
 * to English still opens in Vietnamese). English is still supported and the user
 * can switch at runtime via <LanguageSwitcher /> (`i18n.changeLanguage('en')`).
 *
 * Convention: keys are namespaced by screen/area (e.g. `welcome.title`,
 * `common.terms`). Add new strings to BOTH locale files in `./locales`.
 */
export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'vi';

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE, // always boot in Vietnamese, regardless of device locale
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export default i18n;
