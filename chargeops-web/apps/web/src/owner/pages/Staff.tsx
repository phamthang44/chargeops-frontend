import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, formatDateVn, type StationStaffMember, type Station } from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconUsers,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';
import {
  StaffAssignForm,
  StaffCapabilityMatrix,
  RevokeStaffModal,
} from '../features/staff';

export function Staff() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [memberToRevoke, setMemberToRevoke] = useState<StationStaffMember | null>(null);

  const stationsQ = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  const stationsList: Station[] = useMemo(() => {
    return (
      (Array.isArray(stationsQ.data)
        ? stationsQ.data
        : (stationsQ.data as { items?: Station[] } | undefined)?.items) ?? []
    );
  }, [stationsQ.data]);

  const staffQ = useQuery({
    queryKey: ['staff', 'mine', stationFilter, stationsList.map((s) => s.id).join(',')],
    queryFn: async () => {
      if (stationFilter !== 'ALL') {
        return api.staff.list(stationFilter);
      }
      if (stationsList.length === 0) return [];
      const results = await Promise.all(
        stationsList.map((s) => api.staff.list(s.id).catch(() => []))
      );
      return results.flat();
    },
    enabled: stationsQ.isSuccess,
  });

  const filterStationOptions = useMemo(() => {
    return [
      { value: 'ALL', label: t('staff.list.allStations') },
      ...stationsList
        .filter((s) => s.status === 'active' || s.status === 'ACTIVE')
        .map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [stationsList, t]);

  const revokeMutation = useMutation({
    mutationFn: (m: StationStaffMember) =>
      api.staff.revoke(m.stationId, m.assignmentId),
    onSuccess: (_r, m) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast(
        t('staff.revokeToast', {
          name: m.displayName || m.name || m.email,
          station: m.stationName,
        }),
        'success',
      );
      setMemberToRevoke(null);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  // Filter staff by station and search term
  const filteredStaff = useMemo(() => {
    const list = staffQ.data ?? [];
    return list.filter((m) => {
      if (stationFilter !== 'ALL' && m.stationId !== stationFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchName = (m.displayName || m.name || '').toLowerCase().includes(query);
        const matchEmail = (m.email || '').toLowerCase().includes(query);
        const matchNote = (m.note || '').toLowerCase().includes(query);
        const matchStation = (m.stationName || '').toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchNote && !matchStation) {
          return false;
        }
      }
      return true;
    });
  }, [staffQ.data, stationFilter, search]);

  // Group filtered staff by station
  const byStation = useMemo(() => {
    const map = new Map<string, { stationName: string; members: StationStaffMember[] }>();
    for (const m of filteredStaff) {
      const entry = map.get(m.stationId) ?? { stationName: m.stationName, members: [] };
      entry.members.push(m);
      map.set(m.stationId, entry);
    }
    return [...map.entries()];
  }, [filteredStaff]);

  return (
    <>
      <PageHeader title={t('staff.title')} subtitle={t('staff.subtitle')} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Left Column: Assignment Form & Capability Matrix */}
        <div className="flex flex-col gap-4">
          <StaffAssignForm stations={stationsList} />
          <StaffCapabilityMatrix />
        </div>

        {/* Right Column: Staff Management List */}
        <div className="flex flex-col gap-3.5">
          {/* Header & Filter Toolbar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-ink">{t('staff.list.title')}</span>
              <span className="rounded-full bg-owner-soft px-2.5 py-0.5 text-[11px] font-bold text-owner-deep">
                {t('staff.list.count', { count: filteredStaff.length })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48 sm:w-56">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={t('staff.list.searchPlaceholder')}
                  accent="owner"
                />
              </div>
              <div className="w-40 sm:w-44">
                <Select
                  value={stationFilter}
                  onChange={setStationFilter}
                  options={filterStationOptions}
                  accent="owner"
                />
              </div>
            </div>
          </div>

          {/* List Content */}
          {staffQ.isLoading ? (
            <Card className="p-4 flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </Card>
          ) : byStation.length === 0 ? (
            <Card className="p-6">
              <EmptyState>
                {(staffQ.data?.length ?? 0) === 0
                  ? t('staff.list.empty')
                  : t('staff.list.noSearchResult')}
              </EmptyState>
            </Card>
          ) : (
            <div className="flex flex-col gap-3.5">
              {byStation.map(([id, { stationName, members }]) => (
                <Card key={id} className="overflow-hidden border border-line/60 shadow-subtle">
                  {/* Station Header */}
                  <div className="flex items-center justify-between border-b border-hairline bg-surface-2/80 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-owner" />
                      <span className="text-[13px] font-bold text-ink">{stationName}</span>
                    </div>
                    <span className="rounded bg-chip px-2 py-0.5 font-mono text-[10px] font-semibold text-faint">
                      {id}
                    </span>
                  </div>

                  {/* Staff Members at Station */}
                  <div className="divide-y divide-hairline">
                    {members.map((m) => {
                      const staffName = m.displayName || m.name || m.email;
                      const dateStr = m.assignedAt || m.createdAt || '';

                      return (
                        <div
                          key={m.assignmentId}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-2/30 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-owner-soft text-owner font-bold text-[13px] shadow-sm">
                              {staffName.charAt(0).toUpperCase()}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-[13.5px] font-bold text-ink">
                                  {staffName}
                                </span>
                                <span className="rounded-md bg-good-soft px-2 py-0.5 text-[10px] font-semibold text-good">
                                  {t('staff.list.activeBadge')}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-muted">
                                <span>{m.email}</span>
                                {m.maskedPhone && <span>• {m.maskedPhone}</span>}
                                {dateStr && (
                                  <span>• {t('staff.list.since', { date: formatDateVn(dateStr) })}</span>
                                )}
                              </div>

                              {m.note && (
                                <div className="mt-1.5 inline-block rounded-md bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-body border border-hairline">
                                  <span className="text-faint font-semibold mr-1">{t('staff.list.note')}:</span>
                                  {m.note}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Revoke Button */}
                          <div className="shrink-0 self-end sm:self-center">
                            <Button
                              variant="danger-soft"
                              size="sm"
                              onClick={() => setMemberToRevoke(m)}
                            >
                              {t('staff.list.revokeBtn')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Revoke Information Footer Note */}
          <div className="rounded-xl bg-surface-2 p-3 text-[11.5px] leading-relaxed text-muted border border-hairline">
            <span className="font-semibold text-ink">ℹ️ {t('staff.list.note')}: </span>
            {t('staff.list.revokeNote')}
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      <RevokeStaffModal
        member={memberToRevoke}
        open={Boolean(memberToRevoke)}
        onClose={() => setMemberToRevoke(null)}
        onConfirm={(m) => revokeMutation.mutate(m)}
        isPending={revokeMutation.isPending}
      />
    </>
  );
}
