import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi, type StationStaffMember, type Ticket, type UserAccount } from '@chargeops/api';
import {
  Avatar,
  Button,
  Modal,
  Skeleton,
  StatusPill,
  IconCheck,
  IconUsers,
  IconAlertCircle,
  IconShield,
  IconShieldAlert,
  IconPin,
} from '@chargeops/ui';

interface AssignTicketDrawerProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSubmit: (handlerId: string, reason?: string) => Promise<void>;
  isPending: boolean;
  admin?: boolean;
}

export function AssignTicketDrawer({
  open,
  onClose,
  ticket,
  onSubmit,
  isPending,
  admin = false,
}: AssignTicketDrawerProps) {
  const { t } = useTranslation('tickets');
  const api = useApi();
  const navigate = useNavigate();

  const [selectedHandlerId, setSelectedHandlerId] = useState<string>(ticket.assignedHandlerId || '');
  const [reassignReason, setReassignReason] = useState<string>('');

  const isReassign = ticket.status === 'IN_PROGRESS' || Boolean(ticket.assignedHandlerId);
  const isStationTicket = Boolean(ticket.stationId) || ticket.category === 'CHARGING_ISSUE' || ticket.category === 'BOOKING';
  const isPlatformTicket = !isStationTicket;
  const isAdminStation = admin && isStationTicket;
  const isAdminPlatform = admin && isPlatformTicket;

  // Station staff query (for owner/staff on station context)
  const staffQuery = useQuery({
    queryKey: ['staff', 'station', ticket.stationId],
    queryFn: () => (ticket.stationId ? api.staff.list(ticket.stationId) : Promise.resolve([])),
    enabled: open && !admin && Boolean(ticket.stationId),
  });

  // Admin users query (for admin platform ticket assignment)
  const adminUsersQuery = useQuery({
    queryKey: ['users', 'admins'],
    queryFn: () => api.users.list({ role: 'ADMIN' }),
    enabled: open && isAdminPlatform,
  });

  const activeStaffList = useMemo(() => {
    const raw: StationStaffMember[] = Array.isArray(staffQuery.data) ? staffQuery.data : [];
    return raw.filter((s) => String(s.status).toUpperCase() === 'ACTIVE');
  }, [staffQuery.data]);

  const activeAdminList = useMemo(() => {
    const raw: UserAccount[] = Array.isArray(adminUsersQuery.data) ? adminUsersQuery.data : [];
    return raw.filter((u) => u.status === 'active' || String(u.status).toUpperCase() === 'ACTIVE');
  }, [adminUsersQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminStation) return;
    if (!selectedHandlerId || isPending) return;
    if (isReassign && !reassignReason.trim()) return;

    await onSubmit(selectedHandlerId, reassignReason.trim() || undefined);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <h3 className="text-base font-bold text-ink">
          {isAdminPlatform
            ? isReassign
              ? t('assignModal.titleReassignAdmin', 'Điều chuyển Chuyên viên Nền tảng')
              : t('assignModal.titleAssignAdmin', 'Phân công Chuyên viên Quản trị')
            : isReassign
            ? t('assignModal.titleReassign', 'Điều chuyển Người xử lý Vé')
            : t('assignModal.titleAssign', 'Phân công Nhân viên Phụ trách')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticket Header info */}
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-2 p-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-brand">{ticket.ticketCode || ticket.ticketNo || `#${ticket.id.slice(0, 8)}`}</span>
            <span className="text-faint">·</span>
            {isPlatformTicket ? (
              <span className="inline-flex items-center gap-1 font-medium text-brand">
                <IconShield size={12} strokeWidth={2.2} />
                <span>{t('assignModal.scopePlatform', 'Phạm vi: Cổng thanh toán & Nền tảng')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted truncate">
                <IconPin size={12} className="text-faint shrink-0" />
                <span>{ticket.stationName || t('common.station', 'Trạm sạc')}</span>
              </span>
            )}
          </div>
        </div>

        {/* CASE 1: Admin viewing Station Ticket (Supervisory - No Direct Station Staff Assignment) */}
        {isAdminStation ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-[12px] space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                <IconShieldAlert size={16} />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  {t('assignModal.adminStationScopeTitle', 'Trách nhiệm thuộc Đơn vị vận hành trạm')}
                </div>
                <p className="text-muted leading-relaxed">
                  {t('assignModal.adminStationScopeDesc', 'Sự cố tại trụ sạc do Chủ trạm và nhân viên kỹ thuật trạm trực tiếp xử lý. Thẩm quyền phân công nhân sự tại trạm thuộc về Chủ trạm. Admin thực hiện giám sát tiến độ SLA và kỹ thuật.')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center pt-1 border-t border-amber-500/15">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate('/admin/stations');
                }}
              >
                {t('assignModal.goToStations', 'Xem danh sách trạm hệ thống →')}
              </Button>
            </div>
          </div>
        ) : isAdminPlatform ? (
          /* CASE 2: Admin viewing Platform Ticket (Assigning Platform Admins) */
          <div>
            <label className="block text-[12.5px] font-semibold text-ink">
              {t('assignModal.selectAdminLabel', 'Chọn chuyên viên Quản trị viên phụ trách')} <span className="text-bad">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted">
              {t('assignModal.selectAdminHelp', 'Chuyên viên Quản trị viên (Admin) chịu trách nhiệm tiếp nhận và giải quyết sự cố cấp nền tảng & thanh toán này.')}
            </p>

            <div className="mt-2.5 max-h-56 overflow-y-auto space-y-2 pr-1">
              {adminUsersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : activeAdminList.length === 0 ? (
                <div className="rounded-xl border border-line bg-surface p-4 text-center text-[12px] text-muted space-y-2.5">
                  <IconShield size={20} className="mx-auto text-brand" />
                  <div>{t('assignModal.noAdmins', 'Chưa tìm thấy chuyên viên Quản trị viên nào trong hệ thống.')}</div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate('/admin/users');
                    }}
                  >
                    {t('assignModal.goToUsers', 'Quản lý người dùng toàn hệ thống →')}
                  </Button>
                </div>
              ) : (
                activeAdminList.map((adminUser) => {
                  const isSelected = selectedHandlerId === adminUser.id;
                  const isCurrent = ticket.assignedHandlerId === adminUser.id;
                  const displayName = adminUser.name || adminUser.email;

                  return (
                    <div
                      key={adminUser.id}
                      onClick={() => setSelectedHandlerId(adminUser.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand-soft/20 ring-2 ring-brand/15'
                          : 'border-line bg-surface hover:border-line-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName} size="sm" tone={isSelected ? 'brand' : 'neutral'} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-ink">{displayName}</span>
                            {isCurrent && (
                              <span className="rounded bg-chip px-1.5 py-0.2 text-[9.5px] font-medium text-muted">
                                {t('assignModal.current', 'Hiện tại')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted">{adminUser.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill tone="brand" label={t('assignModal.adminRolePill', 'Quản trị viên')} />
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                            <IconCheck size={12} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* CASE 3: Station Owner / Staff (Assigning Station Staff) */
          <div>
            <label className="block text-[12.5px] font-semibold text-ink">
              {t('assignModal.selectStaffLabel', 'Chọn nhân viên phụ trách')} <span className="text-bad">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted">
              {t('assignModal.selectStaffHelp', 'Chỉ nhân viên đang hoạt động tại trạm mới có quyền tiếp nhận và xử lý phiếu hỗ trợ này.')}
            </p>

            <div className="mt-2.5 max-h-56 overflow-y-auto space-y-2 pr-1">
              {staffQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : activeStaffList.length === 0 ? (
                <div className="rounded-xl border border-line bg-surface p-4 text-center text-[12px] text-muted space-y-2.5">
                  <IconAlertCircle size={20} className="mx-auto text-warn" />
                  <div>{t('assignModal.noActiveStaff', 'Không tìm thấy nhân viên nào đang làm việc tại trạm này. Vui lòng phân công nhân viên vào trạm trước.')}</div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate('/owner/staff');
                    }}
                  >
                    {t('assignModal.goToStaff', 'Quản lý nhân viên trạm →')}
                  </Button>
                </div>
              ) : (
                activeStaffList.map((staff) => {
                  const handlerUserId = staff.userId || staff.assignmentId;
                  const isSelected = selectedHandlerId === handlerUserId;
                  const isCurrent = ticket.assignedHandlerId === handlerUserId;
                  const displayName = staff.displayName || staff.name || staff.email;

                  return (
                    <div
                      key={staff.assignmentId || handlerUserId}
                      onClick={() => setSelectedHandlerId(handlerUserId)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand-soft/20 ring-2 ring-brand/15'
                          : 'border-line bg-surface hover:border-line-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName} size="sm" tone={isSelected ? 'brand' : 'neutral'} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-bold text-ink">{displayName}</span>
                            {isCurrent && (
                              <span className="rounded bg-chip px-1.5 py-0.2 text-[9.5px] font-medium text-muted">
                                {t('assignModal.current', 'Hiện tại')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted">{staff.email} {staff.maskedPhone ? `· ${staff.maskedPhone}` : ''}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill tone="good" label={t('assignModal.activePill', 'Đang làm việc')} />
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                            <IconCheck size={12} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Reassign Reason (Mandatory when reassigning) */}
        {!isAdminStation && isReassign && (
          <div>
            <label className="block text-[12.5px] font-semibold text-ink">
              {t('assignModal.reasonLabel', 'Lý do điều chuyển')} <span className="text-bad">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-muted">
              {t('assignModal.reasonHelp', 'Bắt buộc ghi rõ lý do bàn giao (đổi ca trực, sự cố vượt cấp, v.v.). Người phụ trách trước đó sẽ chuyển giao toàn bộ quyền xử lý.')}
            </p>
            <textarea
              required
              rows={2}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder={t('assignModal.reasonPlaceholder', 'Ví dụ: Đổi ca trực chiều, bàn giao cho chuyên viên xử lý...')}
              className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {isAdminStation ? t('common.close', 'Đóng') : t('common.cancel', 'Hủy')}
          </Button>
          {!isAdminStation && (
            <Button
              type="submit"
              accent="brand"
              disabled={!selectedHandlerId || (isReassign && !reassignReason.trim()) || isPending}
              icon={<IconUsers size={14} strokeWidth={2.2} />}
            >
              {isPending
                ? t('common.saving', 'Đang xử lý...')
                : isReassign
                ? t('assignModal.submitReassign', 'Xác nhận Điều chuyển')
                : t('assignModal.submitAssign', 'Xác nhận Phân công')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
