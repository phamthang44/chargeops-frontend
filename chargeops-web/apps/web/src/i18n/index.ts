import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viCommon from './locales/vi/common.json';
import viOwnerDashboard from './locales/vi/ownerDashboard.json';
import viStaffDashboard from './locales/vi/staffDashboard.json';
import viTickets from './locales/vi/tickets.json';
import viSettings from './locales/vi/settings.json';
import enCommon from './locales/en/common.json';
import enOwnerDashboard from './locales/en/ownerDashboard.json';
import enStaffDashboard from './locales/en/staffDashboard.json';
import enTickets from './locales/en/tickets.json';
import enSettings from './locales/en/settings.json';

// Shared packages own their translation content but not the i18next instance —
// the host app (here) is the one place that initializes i18next and registers
// every package's namespace, same as it's the one place that owns react-query.
// Imported through each package's public `./locales/*` export, not a relative
// reach into its src/ — the app shouldn't know the packages' internal layout.
import viUi from '@chargeops/ui/locales/vi/ui.json';
import enUi from '@chargeops/ui/locales/en/ui.json';
import viAuth from '@chargeops/auth/locales/vi/auth.json';
import enAuth from '@chargeops/auth/locales/en/auth.json';
import viOwner from './locales/vi/owner.json';
import enOwner from './locales/en/owner.json';
import viAdmin from './locales/vi/admin.json';
import enAdmin from './locales/en/admin.json';
import viErrors from './locales/vi/errors.json';
import enErrors from './locales/en/errors.json';

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
    vi: {
      common: viCommon,
      ownerDashboard: viOwnerDashboard,
      staffDashboard: viStaffDashboard,
      tickets: viTickets,
      settings: viSettings,
      ui: viUi,
      auth: viAuth,
      owner: viOwner,
      admin: viAdmin,
      errors: viErrors,
    },
    en: {
      common: enCommon,
      ownerDashboard: enOwnerDashboard,
      staffDashboard: enStaffDashboard,
      tickets: enTickets,
      settings: enSettings,
      ui: enUi,
      auth: enAuth,
      owner: enOwner,
      admin: enAdmin,
      errors: enErrors,
    },
  },
  lng: initialLanguage(),
  fallbackLng: 'vi',
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
});

i18n.on('languageChanged', (lng) => {
  if (isLanguage(lng)) localStorage.setItem(STORAGE_KEY, lng);
});

/**
 * Translates backend API error codes, messageKeys, or messages to the current UI language.
 */
export function getApiErrorMessage(error: unknown): string {
  if (!error) return i18n.t('error.generic', { ns: 'common' });
  if (typeof error === 'string') return error;

  const err = error as {
    code?: string;
    messageKey?: string;
    message?: string;
    details?: unknown;
  };

  // 1. Try translating by code (e.g. STATION_011)
  if (err.code && i18n.exists(`codes.${err.code}`, { ns: 'errors' })) {
    return i18n.t(`codes.${err.code}`, { ns: 'errors' });
  }

  // 2. Try translating by messageKey (e.g. error.station.activeLicenseRequired)
  if (err.messageKey && i18n.exists(`messages.${err.messageKey}`, { ns: 'errors' })) {
    return i18n.t(`messages.${err.messageKey}`, { ns: 'errors' });
  }

  // 3. Fallback to server message or default
  return err.message || i18n.t('error.generic', { ns: 'common' });
}

export default i18n;
