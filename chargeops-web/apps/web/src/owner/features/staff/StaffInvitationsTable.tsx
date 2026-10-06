import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  formatDateVn,
  formatTimeVn,
  type StaffInvitationStatus,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconRefreshCw,
  Pagination,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';

const PAGE_SIZE = 10;
const GRID = '1.4fr 0.9fr 1fr 1fr 0.9fr';

type Tone = 'good' | 'warn' | 'bad' | 'brand' | 'neutral';

const STATUS_TONE: Record<StaffInvitationStatus, Tone> = {
  PENDING: 'warn',
  SENT: 'brand',
  ACCEPTED: 'good',
  CANCELLED: 'neutral',
};

export interface StaffInvitationsTableProps {
  /** Owner endpoint is per station — the caller resolves the station filter. */
  stationId: string;
}

/**
 * Ops-02 invitation list. `SENT` rows whose `expiresAt` has passed render as
 * "expired"; resending one (allowed while PENDING/SENT) re-issues the token and
 * extends the window server-side.
 */
export function StaffInvitationsTable({ stationId }: StaffInvitationsTableProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);

  const listQ = useQuery({
    queryKey: ['staffInvitations', stationId, page],
    queryFn: () => api.staffInvitations.list(stationId, { page, size: PAGE_SIZE }),
    enabled: Boolean(stationId),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staffInvitations'] });

  const resend = useMutation({
    mutationFn: (invitationId: string) => api.staffInvitations.resend(stationId, invitationId),
    onSuccess: (inv) => {
      void invalidate();
      toast(t('staff.invitations.resendSuccess', { email: inv.email }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const cancel = useMutation({
    mutationFn: (invitationId: string) => api.staffInvitations.cancel(stationId, invitationId),
    onSuccess: (inv) => {
      void invalidate();
      toast(t('staff.invitations.cancelSuccess', { email: inv.email }), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  if (!stationId) {
    return (
      <Card className="p-6">
        <EmptyState title={t('staff.invitations.noStation')} />
      </Card>
    );
  }

  if (listQ.isLoading) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </Card>
    );
  }

  if (listQ.error) {
    return (
      <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
        {t('staff.invitations.loadError', { message: getApiErrorMessage(listQ.error) })}
      </Card>
    );
  }

  const rows = listQ.data?.items ?? [];

  return (
    <Card className="overflow-hidden border border-line/60 shadow-subtle">
      <div className="flex items-center justify-between border-b border-hairline bg-surface-2/80 px-4 py-2.5">
        <span className="text-[13px] font-bold text-ink">{t('staff.invitations.title')}</span>
        <span className="rounded-full bg-owner-soft px-2.5 py-0.5 text-[11px] font-bold text-owner-deep">
          {t('staff.invitations.count', { count: listQ.data?.total ?? rows.length })}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState title={t('staff.invitations.empty')} description={t('staff.invitations.emptyBody')} />
        </div>
      ) : (
        <div className="min-w-[720px]">
          <div
            className="grid bg-surface px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
            style={{ gridTemplateColumns: GRID }}
          >
            <span>{t('staff.invitations.cols.email')}</span>
            <span>{t('staff.invitations.cols.status')}</span>
            <span>{t('staff.invitations.cols.sent')}</span>
            <span>{t('staff.invitations.cols.expires')}</span>
            <span className="text-center">{t('staff.invitations.cols.actions')}</span>
          </div>

          {rows.map((inv) => {
            const expired = isExpired(inv.status, inv.expiresAt);
            const busy = resend.isPending || cancel.isPending;
            return (
              <div
                key={inv.invitationId}
                className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium last:border-b-0 hover:bg-row-hover"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="truncate font-semibold text-ink">{inv.email}</span>
                <span>
                  {expired ? (
                    <StatusPill tone="bad" label={t('staff.invitations.expired')} />
                  ) : (
                    <StatusPill
                      tone={STATUS_TONE[inv.status] ?? 'neutral'}
                      label={t(`staff.invitations.status.${inv.status}`)}
                    />
                  )}
                </span>
                <span className="text-muted">
                  {inv.sentAt ? `${formatDateVn(inv.sentAt)} ${formatTimeVn(inv.sentAt)}` : '—'}
                </span>
                <span className={expired ? 'font-semibold text-bad' : 'text-muted'}>
                  {inv.expiresAt ? `${formatDateVn(inv.expiresAt)} ${formatTimeVn(inv.expiresAt)}` : '—'}
                </span>
                <span className="flex items-center justify-center gap-2">
                  {(inv.status === 'PENDING' || inv.status === 'SENT') && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => resend.mutate(inv.invitationId)}
                      >
                        <IconRefreshCw size={12} /> {t('staff.invitations.resend')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        disabled={busy}
                        onClick={() => cancel.mutate(inv.invitationId)}
                      >
                        {t('staff.invitations.cancel')}
                      </Button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={listQ.data?.total ?? rows.length}
        onPage={setPage}
      />
    </Card>
  );
}

function isExpired(status: StaffInvitationStatus, expiresAt?: string): boolean {
  if (status !== 'SENT' || !expiresAt) return false;
  return Date.now() > new Date(expiresAt).getTime();
}
