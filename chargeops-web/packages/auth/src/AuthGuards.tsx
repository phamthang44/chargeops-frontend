import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { getKeycloakClient, isKeycloakEnabled } from './keycloak-client';
import type { Role } from './types';

/** How long the spinner runs before it says the sign-in server is slow. */
const SLOW_HINT_MS = 6000;
const HOME_URL = 'https://chargeops.online';

function BrandMark() {
  return (
    <div className="flex items-center gap-[11px]">
      <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-owner">
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
  );
}

export function SsoRedirectOverlay() {
  const { t } = useTranslation('auth');
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-90 flex flex-col items-center justify-center gap-[22px] bg-night px-6 text-center"
      style={{ animation: 'fadeIn .2s ease' }}
      role="status"
      aria-live="polite"
    >
      <BrandMark />
      <div
        className="h-[34px] w-[34px] rounded-full border-[3px] border-white/15 border-t-owner"
        style={{ animation: 'spin360 .8s linear infinite' }}
      />
      <div className="text-[13px] font-medium text-[#8b8f99]">{t('sso.redirecting')}</div>
      {slow && (
        <div className="max-w-[340px] text-[12.5px] leading-relaxed text-[#8b8f99]" style={{ animation: 'fadeIn .3s ease' }}>
          {t('sso.slow')}
        </div>
      )}
    </div>
  );
}

function SsoUnavailable() {
  const { t } = useTranslation('auth');

  return (
    <div className="fixed inset-0 z-90 flex flex-col items-center justify-center bg-night px-6 text-center" role="alert">
      <BrandMark />
      <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-[#f5b14c]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h1 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-white">{t('sso.unavailableTitle')}</h1>
      <p className="mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-[#a3a7b0]">{t('sso.unavailable')}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-owner px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-owner-strong"
        >
          {t('sso.retry')}
        </button>
        <a
          href={HOME_URL}
          className="rounded-full border border-white/15 px-5 py-2.5 text-[13.5px] font-semibold text-white/85 transition-colors hover:bg-white/[0.06]"
        >
          {t('sso.home')}
        </a>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { authenticated, error, initializing } = useAuth();
  const realMode = isKeycloakEnabled();
  const keycloak = getKeycloakClient();
  const loginStarted = useRef(false);
  const [loginFailed, setLoginFailed] = useState(false);

  useEffect(() => {
    if (initializing || authenticated || error || !realMode || !keycloak || loginStarted.current) return;

    loginStarted.current = true;
    void keycloak.login({ redirectUri: window.location.href }).catch(() => {
      loginStarted.current = false;
      setLoginFailed(true);
    });
  }, [initializing, authenticated, error, realMode, keycloak]);

  if (initializing || (!authenticated && realMode && !error)) {
    return <SsoRedirectOverlay />;
  }

  if ((error || loginFailed) && !authenticated) {
    return <SsoUnavailable />;
  }

  if (!authenticated) return <SsoRedirectOverlay />;
  return <>{children}</>;
}

export function RequireRole({
  role,
  roles,
  children,
}: {
  role?: Role;
  roles?: Role[];
  children: ReactNode;
}) {
  const { t } = useTranslation('auth');
  const { hasRole, user } = useAuth();

  const allowed = roles ?? (role ? [role] : []);
  const authorized = allowed.length === 0 || allowed.some((r) => hasRole(r));

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
        <div className="text-[17px] font-bold">{t('requireRole.title')}</div>
        <div className="max-w-[420px] text-[13px] text-muted">
          <Trans
            t={t}
            i18nKey="requireRole.body"
            values={{ email: user?.email ?? '—', role: allowed.join(' / ') }}
            components={{ bold: <b /> }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
