import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Drawer,
  IconAlertTriangle,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import {
  USER_ROLE_BADGE,
  USER_STATUS,
  formatDateVn,
  formatDateTimeVn,
  useApi,
  type AdminUserProfile,
} from '@chargeops/api';

export interface UserDetailDrawerProps {
  open: boolean;
  profileId: string | null;
  initialData?: AdminUserProfile | null;
  onClose: () => void;
  onSuspend?: (user: AdminUserProfile) => void;
  onResume?: (user: AdminUserProfile) => void;
}

function initialsOf(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
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

function Row({
  label,
  value,
  node,
  mono,
  border,
}: {
  label: string;
  value?: string;
  node?: React.ReactNode;
  mono?: boolean;
  border?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${border ? 'border-b border-hairline pb-2' : ''}`}>
      <span className="shrink-0 text-faint">{label}</span>
      {node ?? (
        <span className={`truncate text-right ${mono ? 'font-mono text-[11.5px]' : 'font-medium text-body'}`}>
          {value}
        </span>
      )}
    </div>
  );
}

/** UM-04: drawer chi tiết người dùng — tự fetch detail, actions[] quyết định footer. */
export function UserDetailDrawer({
  open,
  profileId,
  initialData,
  onClose,
  onSuspend,
  onResume,
}: UserDetailDrawerProps) {
  const { t } = useTranslation('admin');
  const api = useApi();

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'detail', profileId],
    queryFn: () => api.users.detail(profileId!),
    enabled: open && Boolean(profileId),
    initialData: initialData ?? undefined,
  });

  const user = data ?? initialData ?? null;
  const actions = user?.actions ?? [];
  const canSuspend = actions.includes('SUSPEND');
  const canResume = actions.includes('RESUME');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="460px"
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
            {user ? initialsOf(user.displayName) : '…'}
          </span>
          <span className="flex flex-col">
            <span className="text-[14px] font-bold">{user?.displayName ?? '—'}</span>
            <span className="font-mono text-[11px] font-normal text-faint">{user?.email}</span>
          </span>
        </span>
      }
      footer={
        user && (canSuspend || canResume) ? (
          <Button
            variant={canSuspend ? 'danger' : 'primary'}
            className="w-full"
            onClick={() => (canSuspend ? onSuspend?.(user) : onResume?.(user))}
          >
            {canSuspend
              ? t('users.drawer.suspendAccount', 'Tạm khóa tài khoản')
              : t('users.drawer.activateAccount', 'Kích hoạt tài khoản')}
          </Button>
        ) : null
      }
    >
      {isLoading || !user ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-[200px] rounded-card" />
        </div>
      ) : (
        <>
          {user.primaryRoleState !== 'OK' && (
            <div className="mb-3 flex items-start gap-2 rounded-[9px] border border-warn-border bg-warn-soft/40 p-3 text-[12px] text-warn-deep">
              <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {user.primaryRoleState === 'CONFLICT'
                  ? t('users.drawer.roleConflict', 'Vai trò mâu thuẫn — cần đồng bộ lại từ Keycloak.')
                  : t('users.drawer.roleUnknown', 'Vai trò chưa xác định — chưa thể suspend/resume.')}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-[9px] text-[12px]">
            <Row label={t('users.drawer.role', 'Vai trò')} node={<RoleBadge role={user.role} />} border />
            <Row
              label={t('users.drawer.status', 'Trạng thái')}
              node={
                <StatusPill
                  tone={USER_STATUS[user.status]?.tone ?? 'neutral'}
                  label={t(`users.statusMap.${user.status}`, {
                    defaultValue: USER_STATUS[user.status]?.label ?? user.status,
                  })}
                />
              }
              border
            />
            {user.status === 'SUSPENDED' && user.statusReason && (
              <Row label={t('users.drawer.statusReason', 'Lý do khóa')} value={user.statusReason} border />
            )}
            {user.status === 'SUSPENDED' && user.statusChangedAt && (
              <Row
                label={t('users.drawer.statusChangedAt', 'Thay đổi lúc')}
                value={formatDateTimeVn(user.statusChangedAt)}
                border
              />
            )}
            {user.status === 'SUSPENDED' && user.statusChangedBy && (
              <Row label={t('users.drawer.statusChangedBy', 'Bởi')} value={user.statusChangedBy} border />
            )}
            {user.profileCreatedAt && (
              <Row label={t('users.drawer.joined', 'Tham gia')} value={formatDateVn(user.profileCreatedAt)} border />
            )}
            <Row label={t('users.drawer.version', 'Phiên bản')} value={String(user.version)} mono border />
            <Row label={t('users.drawer.profileId', 'Profile ID')} value={user.profileId} mono />
          </div>

          {canSuspend && (
            <p className="mt-4 rounded-[9px] border border-hairline bg-surface-2 p-3 text-[11.5px] leading-relaxed text-muted">
              {t(
                'users.drawer.suspendHint',
                'Tài khoản vẫn đăng nhập được nhưng mọi API sẽ trả AUTH_006 cho tới khi kích hoạt lại. Không thể khóa khi còn booking đang hiệu lực.'
              )}
            </p>
          )}
        </>
      )}
    </Drawer>
  );
}
