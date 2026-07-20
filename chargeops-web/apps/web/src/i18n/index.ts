import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './locales/vi/common.json';
import viOwnerDashboard from './locales/vi/ownerDashboard.json';
import enCommon from './locales/en/common.json';
import enOwnerDashboard from './locales/en/ownerDashboard.json';

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'chargeops.lang';

function isLanguage(value: string | null): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value ?? '');
}

// vi is the platform's home market (Vietnam) — default when nothing is stored yet.
function initialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : 'vi';
}

i18n.use(initReactI18next).init({
  resources: {
    vi: { common: viCommon, ownerDashboard: viOwnerDashboard },
    en: { common: enCommon, ownerDashboard: enOwnerDashboard },
  },
  lng: initialLanguage(),
  fallbackLng: 'vi',
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
});

i18n.on('languageChanged', (lng) => {
  if (isLanguage(lng)) localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
