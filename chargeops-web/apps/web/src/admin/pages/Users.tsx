import { useTranslation } from 'react-i18next';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  USER_ROLE_BADGE,
  USER_STATUS,
  useApi,
  type UserAccount,
  type UserRole,
} from '@chargeops/api';
import {
  Card,
  FilterTabs,
  IconX,
  MetricCard,
  PageHeader,
  SearchInput,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
} from '@chargeops/ui';

type RoleKey = UserRole | 'all';

function initialsOf(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/** FR12 — admin user management: suspend / reactivate accounts. */
export function Users() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [role, setRole] = useState<RoleKey>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      api.users.setStatus(id, status),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast(
        t('users.toastStatus', {
          name: u.name,
          status: t(`users.status.${u.status}`, { defaultValue: USER_STATUS[u.status].label }),
        }),
        'success',
      );
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const all = data ?? [];
  const q = search.trim().toLowerCase();
  const rows = all.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );

  const tabs = useMemo<FilterTab<RoleKey>[]>(() => {
    const count = (r: RoleKey) => (r === 'all' ? all.length : all.filter((u) => u.role === r).length);
    return [
      { key: 'all', label: t('users.roles.all'), count: count('all') },
      { key: 'DRIVER', label: t('users.roles.DRIVER'), count: count('DRIVER') },
      { key: 'OWNER', label: t('users.roles.OWNER'), count: count('OWNER') },
      { key: 'ADMIN', label: t('users.roles.ADMIN'), count: count('ADMIN') },
    ];
  }, [all, t]);

  const selected = all.find((u) => u.id === selectedId) ?? null;

  return (
    <>
      <PageHeader title={t('console.nav.users.title')} subtitle={t('console.nav.users.subtitle')} />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('users.error', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[360px] rounded-card" />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-[11px] md:grid-cols-4">
            <MetricCard label={t('users.kpi.total')} value={String(all.length)} accent="#5b54e8" />
            <MetricCard label={t('users.kpi.drivers')} value={String(all.filter((u) => u.role === 'DRIVER').length)} accent="#0d8a5a" />
            <MetricCard label={t('users.kpi.owners')} value={String(all.filter((u) => u.role === 'OWNER').length)} accent="#12a150" />
            <MetricCard label={t('users.kpi.suspended')} value={String(all.filter((u) => u.status === 'suspended').length)} accent="#c0392b" />
          </div>

          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <FilterTabs tabs={tabs} active={role} onChange={setRole} accent="brand" />
            <div className="ml-auto">
              <SearchInput value={search} onChange={setSearch} placeholder={t('users.searchPlaceholder')} className="w-[230px]" />
            </div>
          </div>

          <div className="grid items-start gap-[13px] lg:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div
                    className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                    style={{ gridTemplateColumns: '1.6fr 1fr 0.8fr 0.8fr 1fr' }}
                  >
                    <span>{t('users.table.cols.account')}</span>
                    <span>{t('users.table.cols.role')}</span>
                    <span>{t('users.table.cols.joined')}</span>
                    <span>{t('users.table.cols.status')}</span>
                    <span className="text-right">{t('users.table.cols.action')}</span>
                  </div>
                  {rows.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      selected={u.id === selectedId}
                      onSelect={() => setSelectedId(u.id)}
                      onToggle={() =>
                        setStatus.mutate({ id: u.id, status: u.status === 'active' ? 'suspended' : 'active' })
                      }
                    />
                  ))}
                </div>
              </div>
            </Card>

            {selected && (
              <UserDetail
                user={selected}
                onClose={() => setSelectedId(null)}
                onToggle={() =>
                  setStatus.mutate({
                    id: selected.id,
                    status: selected.status === 'active' ? 'suspended' : 'active',
                  })
                }
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className="inline-block rounded-[6px] px-[9px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: USER_ROLE_BADGE[role].bg, color: USER_ROLE_BADGE[role].fg }}
    >
      {role}
    </span>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
  onToggle,
}: {
  user: UserAccount;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation('admin');
  const meta = USER_STATUS[user.status];
  const canAct = user.role !== 'ADMIN';
  return (
    <div
      onClick={onSelect}
      className="grid cursor-pointer items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium hover:bg-[#fafaff]"
      style={{
        gridTemplateColumns: '1.6fr 1fr 0.8fr 0.8fr 1fr',
        background: selected ? '#fafaff' : undefined,
        borderLeft: `3px solid ${selected ? '#5b54e8' : 'transparent'}`,
      }}
    >
      <span className="flex items-center gap-2.5">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-[10px] font-semibold text-brand">
          {initialsOf(user.name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="truncate font-mono text-[11px] text-faint">{user.email}</span>
        </span>
      </span>
      <span>
        <RoleBadge role={user.role} />
      </span>
      <span className="text-muted">{formatDateVn(user.joined).slice(3)}</span>
      <span>
        <StatusPill tone={meta.tone} label={t(`users.status.${user.status}`, { defaultValue: meta.label })} />
      </span>
      <span className="text-right">
        {canAct && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-[12px] font-semibold"
            style={{ color: user.status === 'active' ? '#c0392b' : '#0c7a3e' }}
          >
            {user.status === 'active' ? t('users.table.suspend') : t('users.table.activate')}
          </button>
        )}
      </span>
    </div>
  );
}

function UserDetail({
  user,
  onClose,
  onToggle,
}: {
  user: UserAccount;
  onClose: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation('admin');
  const canAct = user.role !== 'ADMIN';
  return (
    <Card className="p-[17px]">
      <div className="mb-3.5 flex items-start justify-between">
        <div className="flex items-center gap-[11px]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-[14px] font-semibold text-brand">
            {initialsOf(user.name)}
          </span>
          <div>
            <div className="text-[15px] font-bold">{user.name}</div>
            <div className="font-mono text-[11px] text-faint">{user.id}</div>
          </div>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-chip" aria-label={t('users.drawer.close')}>
          <IconX size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="mb-[15px] flex flex-col gap-[9px] text-[12px] font-medium text-body">
        <Row label="Email" value={user.email} mono border />
        <Row label={t('users.drawer.role')} node={<RoleBadge role={user.role} />} border />
        <Row label={t('users.drawer.joined')} value={formatDateVn(user.joined)} border />
        <Row label={t('users.drawer.totalBookings')} value={String(user.bookingCount)} valueClass="font-semibold" />
      </div>
      {canAct && (
        <button
          onClick={onToggle}
          className="w-full rounded-[9px] border border-line py-2.5 text-[12.5px] font-semibold hover:bg-canvas"
          style={{ color: user.status === 'active' ? '#c0392b' : '#0c7a3e' }}
        >
          {user.status === 'active' ? t('users.drawer.suspendAccount') : t('users.drawer.activateAccount')}
        </button>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  node,
  mono,
  valueClass = '',
  border,
}: {
  label: string;
  value?: string;
  node?: ReactNode;
  mono?: boolean;
  valueClass?: string;
  border?: boolean;
}) {
  return (
    <div className={`flex justify-between ${border ? 'border-b border-hairline pb-2' : ''}`}>
      <span className="text-faint">{label}</span>
      {node ?? <span className={`${mono ? 'font-mono text-[11.5px]' : ''} ${valueClass}`}>{value}</span>}
    </div>
  );
}
