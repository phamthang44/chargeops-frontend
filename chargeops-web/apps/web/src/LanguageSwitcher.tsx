import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from './i18n';

const LABEL: Record<Language, string> = { vi: 'VI', en: 'EN' };

/**
 * Basic i18n setup placeholder — a fixed corner toggle so language switching
 * is reachable from every screen without changing @chargeops/ui's AppShell
 * yet. Once more pages are migrated, move this into AppShell's top bar.
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-0.5 rounded-ctl border border-line bg-white p-0.5 text-[11.5px] font-semibold shadow-[0_2px_8px_rgba(16,17,26,.1)]">
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          className={[
            'cursor-pointer rounded-[5px] px-2 py-1',
            i18n.language === lng ? 'bg-brand text-white' : 'text-faint hover:bg-canvas',
          ].join(' ')}
        >
          {LABEL[lng]}
        </button>
      ))}
    </div>
  );
}
