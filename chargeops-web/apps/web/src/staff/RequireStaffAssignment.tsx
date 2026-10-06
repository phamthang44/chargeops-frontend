import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth, SsoRedirectOverlay } from '@chargeops/auth';
import {
  ApiError,
  createServices,
  type CurrentStaffContextResponse,
  type Services,
} from '@chargeops/api';
import { Button, IconAlertTriangle } from '@chargeops/ui';
import { getApiErrorMessage } from '../i18n';

/** One shared service instance per mount — the staff pages read through it too. */
export function useStaffServices(): Services {
  const { getToken } = useAuth();
  return useMemo(() => createServices({ ownerView: true, getToken }), [getToken]);
}

export function useStaffContext() {
  const { getToken, user } = useAuth();
  const services = useMemo(() => createServices({ ownerView: true, getToken }), [getToken]);
  const isOwner = user?.roles.includes('station_owner');
  const isAdmin = user?.roles.includes('platform_admin');

  return useQuery<CurrentStaffContextResponse>({
    queryKey: ['staff', 'current-context'],
    queryFn: () => services.staff.currentContext(),
    enabled: !isOwner && !isAdmin,
    staleTime: 30_000,
    retry: 1,
  });
}

type GuardReason = 'no-role' | 'no-assignment' | 'revoked' | 'activation-failed' | 'load-error';

/**
 * FR17 gate for the operations console.
 *
 * Required: Keycloak realm role STAFF **and** an ACTIVE staff assignment.
 * When the role is present but the context is still `staff: false`, the pending
 * invitation is activated once (`POST /me/staff-invitation/activate`, idempotent).
 * A 4xx from that call (revoked assignment, expired invitation, …) lands the user
 * on the blocked screen with the backend's reason instead of a blank console.
 */
export function RequireStaffAssignment({ children }: { children: ReactNode }) {
  const { t } = useTranslation('staff');
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const services = useStaffServices();

  const isOwner = user?.roles.includes('station_owner') ?? false;
  const isAdmin = user?.roles.includes('platform_admin') ?? false;
  const isStaffRole = user?.roles.includes('staff') ?? false;

  const staffQ = useStaffContext();
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<ApiError | null>(null);
  const [attempted, setAttempted] = useState(false);

  const context = staffQ.data;
  const needsActivation =
    !isOwner &&
    !isAdmin &&
    isStaffRole &&
    !attempted &&
    !staffQ.isLoading &&
    !staffQ.isError &&
    context != null &&
    !context.staff;

  useEffect(() => {
    if (!needsActivation) return;
    setAttempted(true);
    setActivating(true);
    services.staffInvitations
      .activate()
      .then(() => queryClient.invalidateQueries({ queryKey: ['staff', 'current-context'] }))
      .catch((err: unknown) => {
        setActivationError(
          err instanceof ApiError
            ? err
            : new ApiError(0, 'UNKNOWN', (err as Error)?.message ?? String(err)),
        );
      })
      .finally(() => setActivating(false));
  }, [needsActivation, queryClient, services]);

  // Owner/admin never operate here — send them to their own console.
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOwner) return <Navigate to="/owner" replace />;

  if (staffQ.isLoading || activating) return <SsoRedirectOverlay />;

  let reason: GuardReason | null = null;
  if (staffQ.isError || !context) reason = 'load-error';
  else if (!isStaffRole) reason = 'no-role';
  else if (!context.staff) reason = 'activation-failed';
  else if (context.assignmentStatus !== 'ACTIVE') reason = 'revoked';

  if (reason) {
    return (
      <StaffGuardScreen
        reason={reason}
        email={user?.email ?? ''}
        detail={activationError ? getApiErrorMessage(activationError) : null}
        onLogout={logout}
      />
    );
  }

  return <>{children}</>;
}

function StaffGuardScreen({
  reason,
  email,
  detail,
  onLogout,
}: {
  reason: GuardReason;
  email: string;
  detail: string | null;
  onLogout: () => void;
}) {
  const { t } = useTranslation('staff');
  const title = t(`guard.${reason}.title`);
  const body = t(`guard.${reason}.body`, { email });

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-canvas p-8"
      style={{ animation: 'fadeIn .25s ease' }}
    >
      <div className="w-full max-w-[480px] rounded-panel border border-line bg-surface p-8 text-center shadow-subtle">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <IconAlertTriangle size={24} />
        </div>
        <h2 className="mb-2 text-[18px] font-bold text-ink">{title}</h2>
        <p className="mb-6 text-[13px] leading-relaxed text-muted">{body}</p>
        {detail ? (
          <p className="mb-6 rounded-xl border border-line bg-canvas px-4 py-3 text-[12px] leading-relaxed text-muted">
            {detail}
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" onClick={() => (window.location.href = '/driver-notice')}>
            {t('guard.toNotice')}
          </Button>
          <Button variant="secondary" onClick={onLogout}>
            {t('guard.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
