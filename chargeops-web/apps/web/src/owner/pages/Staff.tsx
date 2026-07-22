import { useTranslation } from 'react-i18next';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, formatDateVn, type StationStaffMember } from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconCheck,
  IconLock,
  IconUsers,
  IconX,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from '@chargeops/ui';

/**
 * FR17 — Station Staff Management (owner-only; the key is absent from
 * STAFF_KEYS so the staff console has no route to it at all).
 *
 * Invite is email-only on purpose: the SRS exposes no platform-wide user search
 * or directory browsing, so an email address is the sole handle an owner has.
 * A grant takes effect immediately — v1 has no invitation-acceptance step, a
 * simplification the SRS documents on the grounds that the worst case of a
 * mistyped address is an unwanted menu, never exposure of financial data.
 */
export function Staff() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [stationId, setStationId] = useState('');

  const staffQ = useQuery({ queryKey: ['staff', 'mine'], queryFn: () => api.staff.list() });
  const stationsQ = useQuery({ queryKey: ['stations', 'mine'], queryFn: () => api.stations.mine() });

  /** Staff may only be assigned to approved stations the owner actually operates. */
  const stationOptions = useMemo(
    () =>
      (stationsQ.data ?? [])
        .filter((s) => s.status === 'active')
        .map((s) => ({ value: s.id, label: s.name })),
    [stationsQ.data],
  );
  const effectiveStationId = stationId || stationOptions[0]?.value || '';

  const invite = useMutation({
    mutationFn: () => api.staff.invite({ email, stationId: effectiveStationId }),
    onSuccess: ({ member, created }) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast(
        created
          ? t('staff.invite.toastProvisioned', { email: member.email, station: member.stationName })
          : t('staff.invite.toastGranted', { name: member.name, station: member.stationName }),
        'success',
      );
      setEmail('');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const revoke = useMutation({
    mutationFn: (m: StationStaffMember) => api.staff.revoke(m.userId, m.stationId),
    onSuccess: (_r, m) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast(t('staff.revokeToast', { name: m.name, station: m.stationName }), 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  /** Group assignments by station — a person may hold more than one. */
  const byStation = useMemo(() => {
    const map = new Map<string, { stationName: string; members: StationStaffMember[] }>();
    for (const m of staffQ.data ?? []) {
      const entry = map.get(m.stationId) ?? { stationName: m.stationName, members: [] };
      entry.members.push(m);
      map.set(m.stationId, entry);
    }
    return [...map.entries()];
  }, [staffQ.data]);

  const canSubmit = email.trim().length > 0 && !!effectiveStationId && !invite.isPending;

  return (
    <>
      <PageHeader title={t('staff.title')} subtitle={t('staff.subtitle')} />

      <div className="grid items-start gap-[13px] lg:grid-cols-[1fr_1.45fr]">
        {/* ---- invite + capability matrix ---- */}
        <div className="flex flex-col gap-[13px]">
          <Card className="p-[17px]">
            <div className="mb-[15px] text-[15px] font-semibold">{t('staff.invite.title')}</div>
            <div className="flex flex-col gap-[13px]">
              <Field label={t('staff.invite.emailLabel')}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && invite.mutate()}
                  placeholder={t('staff.invite.emailPlaceholder')}
                  className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px] focus:border-owner"
                />
              </Field>
              <Field label={t('staff.invite.stationLabel')}>
                <Select
                  value={effectiveStationId}
                  onChange={setStationId}
                  options={stationOptions}
                  accent="owner"
                />
              </Field>
              <Button accent="owner" fullWidth disabled={!canSubmit} onClick={() => invite.mutate()}>
                {invite.isPending ? t('staff.invite.submitting') : t('staff.invite.submitBtn')}
              </Button>
              <p className="rounded-[9px] bg-chip px-[13px] py-[11px] text-[11.5px] leading-[1.5] text-muted">
                {t('staff.invite.help')}
              </p>
            </div>
          </Card>

          <Card className="p-[17px]">
            <div className="mb-1 flex items-center gap-2">
              <IconLock size={14} className="text-warn" />
              <span className="text-[13.5px] font-semibold">{t('staff.matrix.title')}</span>
            </div>
            <p className="mb-3 text-[11.5px] leading-[1.5] text-faint">{t('staff.matrix.help')}</p>

            <div
              className="grid bg-surface-2 px-3 py-2 text-[9.5px] font-semibold uppercase tracking-[0.05em] text-faint"
              style={{ gridTemplateColumns: '1fr 54px 54px' }}
            >
              <span>{t('staff.matrix.capability')}</span>
              <span className="text-center">{t('staff.matrix.owner')}</span>
              <span className="text-center">{t('staff.matrix.staff')}</span>
            </div>
            {(
              [
                ['viewStation', true],
                ['toggleConnector', true],
                ['handleTickets', true],
                ['pricing', false],
                ['revenue', false],
                ['manageStaff', false],
              ] as const
            ).map(([key, staffAllowed]) => (
              <div
                key={key}
                className="grid items-center border-b border-hairline px-3 py-2 text-[12px] font-medium last:border-b-0"
                style={{ gridTemplateColumns: '1fr 54px 54px' }}
              >
                <span className="text-body">{t(`staff.matrix.rows.${key}`)}</span>
                <span className="flex justify-center">
                  <IconCheck size={14} className="text-good" strokeWidth={2.4} />
                </span>
                <span className="flex justify-center">
                  {staffAllowed ? (
                    <IconCheck size={14} className="text-good" strokeWidth={2.4} />
                  ) : (
                    <IconX size={14} className="text-disabled" strokeWidth={2.4} />
                  )}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* ---- current assignments ---- */}
        <div>
          <div className="mb-[11px] flex items-center justify-between">
            <div className="text-[15px] font-semibold">{t('staff.list.title')}</div>
            <span className="text-[12px] font-medium text-muted">
              {t('staff.list.count', { count: staffQ.data?.length ?? 0 })}
            </span>
          </div>

          {staffQ.isLoading ? (
            <Card className="p-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="mb-2 h-12 w-full" />
              ))}
            </Card>
          ) : byStation.length === 0 ? (
            <Card>
              <EmptyState>{t('staff.list.empty')}</EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-[11px]">
              {byStation.map(([id, { stationName, members }]) => (
                <Card key={id} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-4 py-2.5">
                    <span className="text-[12.5px] font-semibold">{stationName}</span>
                    <span className="font-mono text-[10.5px] font-semibold text-faint">{id}</span>
                  </div>
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-owner-soft">
                          <IconUsers size={14} className="text-owner" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                            <span className="truncate text-[13px] font-semibold">{m.name}</span>
                            <RoleChip>{m.primaryRole}</RoleChip>
                            <RoleChip accent>STATION_STAFF</RoleChip>
                            {m.provisioned && (
                              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-semibold text-warn-deep">
                                {t('staff.list.provisioned')}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted">
                            {m.email} · {t('staff.list.since', { date: formatDateVn(m.createdAt) })}
                          </span>
                        </span>
                      </span>

                      <Button
                        variant="danger-soft"
                        size="sm"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(m)}
                      >
                        {t('staff.revokeBtn')}
                      </Button>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}

          <p className="mt-[11px] rounded-[9px] bg-chip px-[13px] py-[11px] text-[11.5px] leading-[1.5] text-muted">
            {t('staff.list.revokeNote')}
          </p>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      {children}
    </div>
  );
}

function RoleChip({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold ${
        accent ? 'bg-owner-soft text-owner-deep' : 'bg-chip text-muted'
      }`}
    >
      {children}
    </span>
  );
}
