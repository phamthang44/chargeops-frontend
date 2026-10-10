import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  USER_ROLE_BADGE,
  USER_STATUS,
  formatDateVn,
  useApi,
  type AdminUserProfile,
  type AdminUserStatusValue,
} from '@chargeops/api';
import {
  Card,
  EmptyState,
  FilterTabs,
  MetricCard,
  PageHeader,
  Pagination,
  SearchInput,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { UserDetailDrawer } from '../features/users/UserDetailDrawer';
import { UserStatusDialog, type UserStatusAction } from '../features/users/UserStatusDialog';

type RoleKey = 'all' | 'DRIVER' | 'OWNER' | 'ADMIN' | 'STAFF';
type StatusFilter = 'all' | AdminUserStatusValue;

const GRID_COLS = '1.6fr 0.9fr 1fr 0.9fr';
const PAGE_SIZE = 10;

function initialsOf(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

function newCommandId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** UM-04 — admin user management: server pagination, summary cards, suspend/resume dialog. */
export function Users() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [role, setRole] = useState<RoleKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<AdminUserProfile | null>(null);
  const [actionState, setActionState] = useState<{ type: UserStatusAction; user: AdminUserProfile } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const scope = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      role: role === 'all' ? undefined : role,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [debouncedSearch, role, statusFilter],
  );

  const { data: pageData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['users', 'list', { ...scope, page, pageSize: PAGE_SIZE }],
    queryFn: () => api.users.list({ ...scope, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const { data: summary } = useQuery({
    queryKey: ['users', 'summary', { q: scope.q, role: scope.role }],
    // Status cross-tab is independent of the active status filter (UM-00 §6.1).
    queryFn: () => api.users.summary({ q: scope.q, role: scope.role }),
  });

  const setStatus = useMutation({
    mutationFn: ({
      profileId,
      status,
      expectedVersion,
      reason,
    }: {
      profileId: string;
      status: AdminUserStatusValue;
      expectedVersion: number;
      reason: string;
    }) =>
      api.users.setStatus(profileId, {
        status,
        expectedVersion,
        reason,
        commandId: newCommandId(),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      if (res.changed) {
        toast(
          t('users.toastStatus', {
            name: selectedSeed?.displayName ?? res.profileId,
            status: t(`users.statusMap.${res.status}`, { defaultValue: res.status }),
            defaultValue: `Đã cập nhật trạng thái: ${res.status}`,
          }),
          'success',
        );
      } else {
        toast(t('users.toastNoop', { defaultValue: 'Trạng thái đã ở chế độ này — không có thay đổi.' }), 'success');
      }
      setActionState(null);
    },
    onError: (e) => {
      // Optimistic-lock / blocker conflicts: refetch so the drawer shows the fresh version.
      qc.invalidateQueries({ queryKey: ['users'] });
      toast(getApiErrorMessage(e), 'error');
      setActionState(null);
    },
  });

  const rows = pageData?.items ?? [];
  const total = pageData?.total ?? 0;

  const tabs = useMemo<FilterTab<RoleKey>[]>(() => {
    const byRole = summary?.byRole ?? {};
    return [
      { key: 'all', label: t('users.roles.all'), count: summary?.totalProfiles },
      { key: 'DRIVER', label: t('users.roles.DRIVER'), count: byRole.DRIVER },
      { key: 'STAFF', label: t('users.roles.STAFF'), count: byRole.STAFF },
      { key: 'OWNER', label: t('users.roles.OWNER'), count: byRole.OWNER },
      { key: 'ADMIN', label: t('users.roles.ADMIN'), count: byRole.ADMIN },
    ];
  }, [summary, t]);

  const statusTabs = useMemo<FilterTab<StatusFilter>[]>(() => {
    const byStatus = summary?.byStatus ?? {};
    return [
      { key: 'all', label: t('users.statusFilters.all'), count: summary?.totalProfiles },
      { key: 'ACTIVE', label: t('users.statusMap.ACTIVE', 'Hoạt động'), count: byStatus.ACTIVE },
      { key: 'SUSPENDED', label: t('users.statusMap.SUSPENDED', 'Tạm khóa'), count: byStatus.SUSPENDED },
    ];
  }, [summary, t]);

  const openDetail = (user: AdminUserProfile) => {
    setSelectedId(user.profileId);
    setSelectedSeed(user);
  };

  const openAction = (type: UserStatusAction, user: AdminUserProfile) => {
    setActionState({ type, user });
  };

  return (
    <>
      <PageHeader title={t('console.nav.users.title')} subtitle={t('console.nav.users.subtitle')} />

      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('console.nav.users.title')}
          title={t('users.error', { defaultValue: 'Không thể tải danh sách người dùng' })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading || !pageData ? (
        <Skeleton className="h-[360px] rounded-card" />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-[11px] md:grid-cols-4">
            <MetricCard label={t('users.kpi.total')} value={String(summary?.totalProfiles ?? total)} accent="#5b54e8" />
            <MetricCard label={t('users.kpi.drivers')} value={String(summary?.byRole?.DRIVER ?? 0)} accent="#0d8a5a" />
            <MetricCard label={t('users.kpi.staff')} value={String(summary?.byRole?.STAFF ?? 0)} accent="#b7791f" />
            <MetricCard label={t('users.kpi.suspended')} value={String(summary?.byStatus?.SUSPENDED ?? 0)} accent="#c0392b" />
          </div>

          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <FilterTabs tabs={tabs} active={role} onChange={(r) => { setRole(r); setPage(0); }} accent="brand" />
            <FilterTabs tabs={statusTabs} active={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(0); }} accent="brand" />
            <div className="ml-auto">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder={t('users.searchPlaceholder')}
                className="w-[230px]"
              />
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div
                  className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                  style={{ gridTemplateColumns: GRID_COLS }}
                >
                  <span>{t('users.table.cols.account')}</span>
                  <span>{t('users.table.cols.role')}</span>
                  <span>{t('users.table.cols.joined')}</span>
                  <span className="text-right">{t('users.table.cols.status')}</span>
                </div>
                {rows.length === 0 ? (
                  <EmptyState
                    title={t('users.table.emptyTitle', 'Không tìm thấy người dùng')}
                    description={t('users.table.emptyDesc', 'Thử thay đổi từ khóa hoặc bộ lọc vai trò/trạng thái.')}
                  />
                ) : (
                  rows.map((u) => (
                    <UserRow key={u.profileId} user={u} onSelect={() => openDetail(u)} />
                  ))
                )}
              </div>
            </div>
          </Card>

          {total > 0 && (
            <div className="mt-3.5">
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
            </div>
          )}
        </>
      )}

      <UserDetailDrawer
        open={Boolean(selectedId)}
        profileId={selectedId}
        initialData={selectedSeed}
        onClose={() => {
          setSelectedId(null);
          setSelectedSeed(null);
        }}
        onSuspend={(u) => openAction('suspend', u)}
        onResume={(u) => openAction('resume', u)}
      />

      {actionState && (
        <UserStatusDialog
          open
          type={actionState.type}
          user={actionState.user}
          pending={setStatus.isPending}
          onClose={() => setActionState(null)}
          onConfirm={(reason) =>
            setStatus.mutate({
              profileId: actionState.user.profileId,
              status: actionState.type === 'suspend' ? 'SUSPENDED' : 'ACTIVE',
              expectedVersion: actionState.user.version,
              reason,
            })
          }
        />
      )}
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation('admin');
  const meta = USER_ROLE_BADGE[role as keyof typeof USER_ROLE_BADGE] ?? USER_ROLE_BADGE.UNKNOWN;
  const label = t(`users.roles.${role}`, t('users.roles.UNKNOWN', 'Chưa xác định'));
  return (
    <span
      className="inline-block rounded-[6px] px-[9px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: meta.bg, color: meta.fg }}
    >
      {label}
    </span>
  );
}

function UserRow({ user, onSelect }: { user: AdminUserProfile; onSelect: () => void }) {
  const { t } = useTranslation('admin');
  const meta = USER_STATUS[user.status] ?? { tone: 'neutral' as const, label: user.status };
  return (
    <div
      onClick={onSelect}
      className="grid cursor-pointer items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium hover:bg-row-hover"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <span className="flex items-center gap-2.5">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-[10px] font-semibold text-brand">
          {initialsOf(user.displayName)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{user.displayName}</span>
          <span className="truncate font-mono text-[11px] text-faint">{user.email}</span>
        </span>
      </span>
      <span>
        <RoleBadge role={user.role} />
      </span>
      <span className="text-muted">{user.profileCreatedAt ? formatDateVn(user.profileCreatedAt) : '—'}</span>
      <span className="text-right">
        <StatusPill
          tone={meta.tone}
          label={t(`users.statusMap.${user.status}`, { defaultValue: meta.label })}
        />
      </span>
    </div>
  );
}
