import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

/**
 * App i18n setup.
 *
 * UI language defaults to Vietnamese (the primary audience). The app reads the
 * device locale on launch; if it is a supported language we use it, otherwise we
 * fall back to Vietnamese. Switch at runtime with `i18n.changeLanguage('en')`.
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

function resolveInitialLanguage(): SupportedLanguage {
  const device = getLocales()[0]?.languageCode;
  return SUPPORTED_LANGUAGES.includes(device as SupportedLanguage)
    ? (device as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export default i18n;
