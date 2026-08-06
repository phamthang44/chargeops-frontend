import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import type { Role } from './types';

export function SsoRedirectOverlay() {
  const { t } = useTranslation('auth');

  return (
    <div
      className="fixed inset-0 z-90 flex flex-col items-center justify-center gap-[22px] bg-night"
      style={{ animation: 'fadeIn .2s ease' }}
    >
      <div className="flex items-center gap-[11px]">
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-brand">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />
          </svg>
        </span>
        <span className="text-[20px] font-bold tracking-[-0.01em] text-white">ChargeOps</span>
      </div>
      <div
        className="h-[34px] w-[34px] rounded-full border-[3px] border-white/15 border-t-brand"
        style={{ animation: 'spin360 .8s linear infinite' }}
      />
      <div className="text-[13px] font-medium text-[#8b8f99]">{t('sso.redirecting')}</div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { authenticated, error } = useAuth();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-8 text-center text-muted">
        {error}
      </div>
    );
  }

  if (!authenticated) return <SsoRedirectOverlay />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { t } = useTranslation('auth');
  const { hasRole, user } = useAuth();

  if (!hasRole(role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
        <div className="text-[17px] font-bold">{t('requireRole.title')}</div>
        <div className="max-w-[420px] text-[13px] text-muted">
          <Trans
            t={t}
            i18nKey="requireRole.body"
            values={{ email: user?.email ?? '—', role }}
            components={{ bold: <b /> }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
