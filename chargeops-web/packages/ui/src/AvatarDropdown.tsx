import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import { IconSettings, IconLogout, IconSun, IconMoon } from './icons';

export interface AvatarDropdownProps {
  userName: string;
  userEmail?: string;
  rolePill: {
    label: string;
    bg: string;
    fg: string;
  };
  accent: 'brand' | 'owner';
  onSettings: () => void;
  onLogout: () => void;
}

export function AvatarDropdown({
  userName,
  userEmail,
  rolePill,
  accent,
  onSettings,
  onLogout,
}: AvatarDropdownProps) {
  const { t } = useTranslation('ui');
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const applied = document.documentElement.dataset.theme;
    return applied === 'dark' ? 'dark' : 'light';
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'light' || detail === 'dark') {
        setTheme(detail);
      }
    };
    window.addEventListener('chargeops-theme-change', handleThemeChange);
    return () => window.removeEventListener('chargeops-theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('chargeops-theme-change', { detail: newTheme }));
  };

  const borderHighlightColor = accent === 'owner' ? 'hover:border-owner-border' : 'hover:border-brand-tint';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center rounded-full border-2 border-transparent transition-all duration-150 ${borderHighlightColor} focus:outline-none`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={userName} size="md" tone={accent === 'owner' ? 'owner' : 'brand'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-panel border border-line-2 bg-surface p-2.5 shadow-[0_12px_32px_rgba(16,17,26,0.12)] backdrop-blur-md"
          style={{ animation: 'popIn .12s ease-out' }}
        >
          {/* User Profile Header */}
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={userName} size="md" tone={accent === 'owner' ? 'owner' : 'brand'} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-ink leading-tight">
                {userName}
              </div>
              {userEmail && (
                <div className="truncate text-[11.5px] text-muted mt-0.5 font-medium leading-none">
                  {userEmail}
                </div>
              )}
              <div className="mt-2">
                <span
                  className="inline-flex rounded-[5px] px-2 py-0.5 text-[9.5px] font-bold tracking-[0.02em] leading-none"
                  style={{ background: rolePill.bg, color: rolePill.fg }}
                >
                  {rolePill.label}
                </span>
              </div>
            </div>
          </div>

          <div className="my-1.5 h-px bg-line-3" />

          {/* Quick Actions */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
              className="flex w-full items-center gap-2.5 rounded-ctl px-2.5 py-2 text-left text-[13px] font-medium text-body hover:bg-chip transition-colors duration-100"
            >
              <IconSettings size={15} strokeWidth={2} className="text-muted" />
              <span>{t('avatarMenu.settings')}</span>
            </button>

            {/* Theme Toggle Segmented Control */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[13px] font-medium text-body">{t('avatarMenu.theme')}</span>
              <div className="flex rounded-ctl bg-chip p-0.5 border border-line-3">
                <button
                  type="button"
                  onClick={() => toggleTheme('light')}
                  className={`flex h-6 w-10 items-center justify-center rounded-[7px] transition-all duration-150 ${
                    theme === 'light'
                      ? 'bg-surface text-ink shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                      : 'text-muted hover:text-ink'
                  }`}
                  title={t('avatarMenu.themeLight')}
                >
                  <IconSun size={14} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme('dark')}
                  className={`flex h-6 w-10 items-center justify-center rounded-[7px] transition-all duration-150 ${
                    theme === 'dark'
                      ? 'bg-surface text-ink shadow-[0_2px_6px_rgba(0,0,0,0.2)]'
                      : 'text-muted hover:text-ink'
                  }`}
                  title={t('avatarMenu.themeDark')}
                >
                  <IconMoon size={14} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          <div className="my-1.5 h-px bg-line-3" />

          {/* Logout Action */}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-ctl px-2.5 py-2 text-left text-[13px] font-medium text-bad hover:bg-bad-soft transition-colors duration-100"
          >
            <IconLogout size={15} strokeWidth={2} />
            <span>{t('avatarMenu.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
