import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@chargeops/auth';
import {
  Avatar,
  Card,
  IconGlobe,
  IconMoon,
  IconSun,
  PageHeader,
  SegmentedControl,
} from '@chargeops/ui';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n';
import { SUPPORTED_THEMES, useTheme, type Theme } from '../../theme';

/** Reached only via the header avatar menu (§ AppShell onSettings) — not a sidebar item. Shared by owner/staff/admin. */
export function SettingsPage({ accent = 'brand' }: { accent?: 'brand' | 'owner' }) {
  const { t, i18n } = useTranslation('settings');
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const langSegments = SUPPORTED_LANGUAGES.map((l) => ({
    key: l,
    label: t(`language.options.${l}`),
    desc: l === 'vi' ? 'Vietnamese' : 'English',
    icon: (
      <span className="text-[18px] leading-none">
        {l === 'vi' ? '🇻🇳' : '🇬🇧'}
      </span>
    ),
  }));

  const themeSegments = [
    {
      key: 'light' as Theme,
      label: t('theme.options.light'),
      desc: t('theme.lightDesc'),
      icon: <IconSun size={20} strokeWidth={1.8} />,
    },
    {
      key: 'dark' as Theme,
      label: t('theme.options.dark'),
      desc: t('theme.darkDesc'),
      icon: <IconMoon size={20} strokeWidth={1.8} />,
    },
  ];

  const iconColor = accent === 'owner' ? 'text-owner-deep' : 'text-brand';

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="flex max-w-[600px] flex-col gap-4">
        {/* Profile card */}
        <Card className="flex items-center gap-[14px] p-[18px]">
          <Avatar name={user?.name ?? '···'} size="lg" tone={accent} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold text-ink">{user?.name ?? '···'}</div>
            <div className="truncate text-[12.5px] text-muted">{user?.email}</div>
          </div>
          <span className="hidden shrink-0 rounded-full bg-chip px-3 py-[5px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted sm:inline-block">
            {user?.roles?.[0] ?? 'USER'}
          </span>
        </Card>

        {/* Language */}
        <Card className="p-[18px]">
          <SectionHeader
            icon={<IconGlobe size={16} className={iconColor} />}
            title={t('language.title')}
            desc={t('language.desc')}
            accent={accent}
          />
          <SegmentedControl
            segments={langSegments}
            active={i18n.language as Language}
            onChange={(l) => i18n.changeLanguage(l)}
            variant="card"
            accent={accent}
          />
        </Card>

        {/* Theme */}
        <Card className="p-[18px]">
          <SectionHeader
            icon={
              theme === 'dark'
                ? <IconMoon size={16} className={iconColor} />
                : <IconSun size={16} className={iconColor} />
            }
            title={t('theme.title')}
            desc={t('theme.desc')}
            accent={accent}
          />
          <SegmentedControl
            segments={themeSegments}
            active={theme}
            onChange={(v) => setTheme(v as Theme)}
            variant="card"
            accent={accent}
          />
        </Card>
      </div>
    </>
  );
}

function SectionHeader({
  icon,
  title,
  desc,
  accent = 'brand',
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  accent?: 'brand' | 'owner';
}) {
  const bgClass = accent === 'owner' ? 'bg-owner-soft' : 'bg-brand-soft';
  return (
    <div className="mb-[14px] flex items-start gap-[11px]">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${bgClass}`}>
        {icon}
      </span>
      <div>
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-faint">{desc}</div>
      </div>
    </div>
  );
}
