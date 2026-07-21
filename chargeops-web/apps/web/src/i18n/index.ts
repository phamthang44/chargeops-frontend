import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './locales/vi/common.json';
import viOwnerDashboard from './locales/vi/ownerDashboard.json';
import enCommon from './locales/en/common.json';
import enOwnerDashboard from './locales/en/ownerDashboard.json';

// Shared packages own their translation content but not the i18next instance —
// the host app (here) is the one place that initializes i18next and registers
// every package's namespace, same as it's the one place that owns react-query.
// Imported through each package's public `./locales/*` export, not a relative
// reach into its src/ — the app shouldn't know the packages' internal layout.
import viUi from '@chargeops/ui/locales/vi/ui.json';
import enUi from '@chargeops/ui/locales/en/ui.json';
import viAuth from '@chargeops/auth/locales/vi/auth.json';
import enAuth from '@chargeops/auth/locales/en/auth.json';

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
    vi: { common: viCommon, ownerDashboard: viOwnerDashboard, ui: viUi, auth: viAuth },
    en: { common: enCommon, ownerDashboard: enOwnerDashboard, ui: enUi, auth: enAuth },
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
