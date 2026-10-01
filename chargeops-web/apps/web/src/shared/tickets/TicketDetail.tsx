import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  formatTimeVn,
  TICKET_CATEGORY,
  TICKET_CLOSE_REASON,
  TICKET_PRIORITY,
  TICKET_STATUS,
  useApi,
  type Ticket,
  type TicketCategory,
  type TicketFinding,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from '@chargeops/api';
import {
  Avatar,
  Button,
  Card,
  ChatComposer,
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconHistory,
  IconLock,
  IconPhone,
  IconPin,
  IconRefreshCw,
  IconSend,
  IconShield,
  IconShieldAlert,
  IconUsers,
  IconWrench,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  AssignTicketDrawer,
  ResolveTicketModal,
  TicketCountdownTimer,
  TicketEventTimeline,
  TicketLifecycleStepper,
} from './components';
import { getTicketErrorMeta } from './utils/ticketErrors';

const CONCLUSION_LABELS: Record<string, { label: string; tone: 'bad' | 'warn' | 'neutral' | 'brand' }> = {
  HARDWARE_FAULT: { label: 'Lỗi phần cứng trụ sạc', tone: 'bad' },
  STATION_OFFLINE: { label: 'Trạm mất kết nối mạng', tone: 'bad' },
  SOFTWARE_BUG: { label: 'Sự cố phần mềm / firmware', tone: 'warn' },
  USER_ERROR: { label: 'Thao tác phía người dùng', tone: 'neutral' },
  OTHER: { label: 'Nguyên nhân khác', tone: 'neutral' },
};

function getActorMeta(m: TicketMessage) {
  const kind = m.authorKind;
  if (kind === 'ADMIN') {
    return {
      label: 'Quản trị viên ChargeOps',
      badgeClass: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
      tone: 'brand' as const,
      isInternal: true,
    };
  }
  if (kind === 'OWNER') {
    return {
      label: 'Chủ trạm',
      badgeClass: 'bg-owner-soft text-owner-deep border border-owner-border',
      tone: 'owner' as const,
      isInternal: true,
    };
  }
  if (kind === 'STAFF') {
    return {
      label: 'Nhân viên trạm',
      badgeClass: 'bg-brand-soft text-brand-deep border border-brand-line',
      tone: 'brand' as const,
      isInternal: true,
    };
  }
  // Reporter or driver
  return {
    label: 'Tài xế (Người báo cáo)',
    badgeClass: 'bg-chip text-muted border border-hairline',
    tone: 'neutral' as const,
    isInternal: false,
  };
}

export function TicketDetail({ admin = false }: { admin?: boolean }) {
  const { id = '' } = useParams();
  const { t } = useTranslation('tickets');
  const navigate = useNavigate();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const accent = admin ? 'brand' : 'owner';

  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'thread' | 'events'>('thread');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number>(0);

  const ticketQuery = useQuery({
    queryKey: ['tickets', 'get', id],
    queryFn: () => api.tickets.get(id),
    refetchInterval: (query) => (query.state.data?.status !== 'CLOSED' ? 6000 : false),
    refetchIntervalInBackground: false,
  });
  const messagesQuery = useQuery({
    queryKey: ['tickets', 'messages', id],
    queryFn: () => api.tickets.messages(id),
    refetchInterval: () => (ticketQuery.data?.status !== 'CLOSED' ? 3000 : false),
    refetchIntervalInBackground: false,
  });
  const staffQuery = useQuery({
    queryKey: ['staff', 'station', ticketQuery.data?.stationId],
    queryFn: () => (ticketQuery.data?.stationId ? api.staff.list(ticketQuery.data.stationId) : Promise.resolve([])),
    enabled: Boolean(ticketQuery.data?.stationId),
  });

  useEffect(() => {
    const msgs = messagesQuery.data ?? ticketQuery.data?.messages ?? [];
    if (msgs.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = msgs.length;
  }, [messagesQuery.data?.length, ticketQuery.data?.messages?.length]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['tickets'] });
  };

  const handleMutationError = (e: any) => {
    const errMeta = getTicketErrorMeta(e, t);
    if (errMeta.isConflict) {
      toast({
        title: errMeta.title,
        message: errMeta.message,
        tone: 'warning',
        code: errMeta.code,
        action: {
          label: t('errors.refreshAction', 'Tải lại trang'),
          onClick: invalidateAll,
        },
      });
      invalidateAll();
    } else {
      toast({
        title: errMeta.title,
        message: errMeta.message,
        tone: 'error',
        code: errMeta.code,
      });
    }
  };

  const reply = useMutation({
    mutationFn: (body: string) => api.tickets.reply(id, body),
    onSuccess: () => {
      setDraft('');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const claim = useMutation({
    mutationFn: () => api.tickets.claim(id, ticketQuery.data?.version),
    onSuccess: () => {
      toast(t('detail.claimSuccess', 'Bạn đã nhận xử lý vé này thành công!'), 'success');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const assign = useMutation({
    mutationFn: (data: { handlerId: string; reason?: string }) =>
      api.tickets.assign(id, {
        expectedVersion: ticketQuery.data?.version,
        handlerId: data.handlerId,
        reason: data.reason,
      }),
    onSuccess: () => {
      toast(t('detail.assignSuccess', 'Phân công nhân viên xử lý thành công!'), 'success');
      setIsAssignDrawerOpen(false);
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const resolve = useMutation({
    mutationFn: (reason: string) =>
      api.tickets.resolve(id, {
        expectedVersion: ticketQuery.data?.version,
        reason,
      }),
    onSuccess: () => {
      toast(t('detail.resolveSuccess', 'Đã đánh dấu giải quyết sự cố và gửi thông báo cho tài xế!'), 'success');
      setIsResolveModalOpen(false);
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const escalate = useMutation({
    mutationFn: () => api.tickets.escalate(id),
    onSuccess: (tk) => {
      toast(t('detail.escalateSuccess', { id: tk.id }), 'success');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  if (ticketQuery.error) {
    const errMeta = getTicketErrorMeta(ticketQuery.error, t);
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('..')}
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft size={14} strokeWidth={2.2} />
          {t('errors.backToList', 'Quay lại danh sách phiếu')}
        </button>

        <Card className="rounded-2xl p-6 sm:p-8 border border-red-500/25 bg-surface text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <IconShieldAlert size={28} strokeWidth={2} />
          </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <h2 className="text-lg font-bold text-ink sm:text-xl">{errMeta.title}</h2>
              {errMeta.code && (
                <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-chip text-muted border border-hairline">
                  {errMeta.code}
                </span>
              )}
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-muted max-w-lg mx-auto">
              {errMeta.message}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('..')}
              >
                {t('errors.backToList', 'Quay lại danh sách phiếu')}
              </Button>
              <Button
                variant="primary"
                accent={accent}
                size="sm"
                onClick={() => ticketQuery.refetch()}
              >
                {t('errors.refreshAction', 'Tải lại trang')}
              </Button>
            </div>
          </Card>
        </div>
    );
  }

  if (ticketQuery.isLoading || !ticketQuery.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full rounded-card" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-card lg:col-span-8" />
          <Skeleton className="h-96 rounded-card lg:col-span-4" />
        </div>
      </div>
    );
  }

  const tk = ticketQuery.data;
  const statusKey = (String(tk.status || 'OPEN').toUpperCase()) as TicketStatus;
  const meta = TICKET_STATUS[statusKey] ?? { label: tk.status, tone: 'neutral' as const };
  const priorityKey = (tk.priority || 'MEDIUM') as TicketPriority;
  const priorityMeta = TICKET_PRIORITY[priorityKey] || { label: priorityKey, tone: 'neutral' as const };
  const categoryKey = tk.category as TicketCategory;
  const categoryLabel = TICKET_CATEGORY[categoryKey] ?? tk.category;
  const messages = messagesQuery.data ?? tk.messages ?? [];
  const code = tk.ticketCode || tk.ticketNo || (tk.id ? `TKT-${tk.id.slice(0, 8).toUpperCase()}` : '—');

  const isOpen = statusKey === 'OPEN';
  const isInProgress = statusKey === 'IN_PROGRESS';
  const isResolved = statusKey === 'RESOLVED';
  const isClosed = statusKey === 'CLOSED';
  const hasRefund = Boolean(tk.refundIds && tk.refundIds.length > 0);
  const findings: TicketFinding[] = tk.findings ?? [];

  const isStationTicket = Boolean(tk.stationId) || tk.category === 'CHARGING_ISSUE' || tk.category === 'BOOKING';
  const isPlatformTicket = !isStationTicket;
  const isAdminStationSupervisory = admin && isStationTicket;
  const isAdminPlatformDirect = admin && isPlatformTicket;

  const staffList = Array.isArray(staffQuery.data) ? staffQuery.data : [];
  const assignedStaff = tk.assignedHandlerId
    ? staffList.find((s: any) => s.userId === tk.assignedHandlerId || s.id === tk.assignedHandlerId)
    : undefined;

  const resolvedHandlerName =
    tk.assignedHandlerName ||
    tk.assignedToName ||
    assignedStaff?.displayName ||
    assignedStaff?.name ||
    (tk.assignedHandlerId
      ? `${t('detail.handlerCard.techFallback', 'Kỹ thuật viên')} #${tk.assignedHandlerId.slice(0, 8)}`
      : isInProgress
        ? t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm')
        : null);

  const handlerName = resolvedHandlerName;
  const isAssigned = Boolean(tk.assignedHandlerId || resolvedHandlerName || isInProgress);
  const closeReasonMeta = tk.closeReason ? TICKET_CLOSE_REASON[tk.closeReason] : undefined;

  return (
    <div className="space-y-4">
      {/* Back button & Eyebrow */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('..')}
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft size={14} strokeWidth={2.2} />
          {t('detail.back', 'Quay lại danh sách')}
        </button>

        <span className="text-[11.5px] font-medium text-faint">
          {formatDateVn(tk.createdAt)}
        </span>
      </div>

      {/* Ticket Header Banner (Clean Single-Bezel) */}
      <Card className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13px] font-bold text-brand">{code}</span>
              <span className="text-[11px] text-faint">·</span>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted">
                <span>{t('table.cols.priority', 'Ưu tiên')}:</span>
                <span className="font-semibold text-ink">{t(`priority.${priorityKey}`, priorityMeta.label)}</span>
              </span>
              <StatusPill tone={meta.tone} label={t(`status.${statusKey}`, meta.label)} />

              {isAdminStationSupervisory && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/25">
                  <IconShieldAlert size={12} strokeWidth={2.2} />
                  <span>{t('supervisory.badge', 'Giám sát Vận hành Trạm')}</span>
                </span>
              )}

              {isAdminPlatformDirect && (
                <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-deep border border-brand-line">
                  <IconShield size={12} strokeWidth={2.2} />
                  <span>{t('platformQueue.badge', 'Hàng chờ Nền tảng & Thanh toán')}</span>
                </span>
              )}

              {hasRefund && (
                <span className="inline-flex items-center gap-1 rounded bg-good-soft px-2 py-0.5 text-[11px] font-medium text-good-deep">
                  <IconCheckCircle size={12} strokeWidth={2.2} />
                  <span>{t('detail.refund.autoGrantedBadge', 'Hoàn cọc 100%')}</span>
                </span>
              )}
            </div>

            <h1 className="mt-2 text-lg font-bold text-ink sm:text-xl">
              {tk.subject || tk.title || t('detail.defaultSubject', 'Phiếu hỗ trợ')}
            </h1>

            {tk.description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                {tk.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                {t(`category.${categoryKey}`, categoryLabel)}
              </span>
              {tk.stationName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                  <IconPin size={12} strokeWidth={2.2} /> {tk.stationName}
                </span>
              )}
              {tk.bookingId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                  <IconCalendar size={12} strokeWidth={2.2} /> #{String(tk.bookingId).slice(0, 8)}
                </span>
              )}
            </div>
          </div>

          {/* Action Dock (Strict Role-Based Scopes) */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* Case A: Admin in Station Supervisory Mode */}
            {isAdminStationSupervisory && (
              <>
                {!isClosed && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={escalate.isPending}
                    onClick={() => escalate.mutate()}
                    icon={<IconShieldAlert size={14} strokeWidth={2.2} />}
                  >
                    {escalate.isPending ? t('detail.escalating', 'Đang báo cáo...') : t('supervisory.escalateBtn', 'Báo cáo khẩn')}
                  </Button>
                )}
              </>
            )}

            {/* Case B: Admin in Platform Direct Queue */}
            {isAdminPlatformDirect && (
              <>
                {isOpen && (
                  <>
                    <Button
                      accent="brand"
                      size="md"
                      disabled={claim.isPending}
                      onClick={() => claim.mutate()}
                      icon={<IconCheck size={14} strokeWidth={2.5} />}
                    >
                      {claim.isPending ? t('detail.claiming', 'Đang nhận...') : t('platformQueue.claimBtn', 'Tiếp nhận xử lý sự cố')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      icon={<IconUsers size={14} strokeWidth={2} />}
                    >
                      {t('platformQueue.assignAdminBtn', 'Phân công chuyên viên')}
                    </Button>
                  </>
                )}

                {isInProgress && (
                  <>
                    <Button
                      accent="brand"
                      size="md"
                      onClick={() => setIsResolveModalOpen(true)}
                      icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
                    >
                      {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      icon={<IconUsers size={14} strokeWidth={2} />}
                    >
                      {t('detail.reassignBtn', 'Điều chuyển')}
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Case C: Station Owner & Station Staff (!admin) */}
            {!admin && (
              <>
                {isOpen && (
                  <>
                    <Button
                      accent="brand"
                      size="md"
                      disabled={claim.isPending}
                      onClick={() => claim.mutate()}
                      icon={<IconCheck size={14} strokeWidth={2.5} />}
                    >
                      {claim.isPending ? t('detail.claiming', 'Đang nhận...') : t('detail.claimBtn', 'Tự nhận xử lý')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      icon={<IconUsers size={14} strokeWidth={2} />}
                    >
                      {t('detail.assignBtn', 'Gán nhân viên')}
                    </Button>
                  </>
                )}

                {isInProgress && (
                  <>
                    <Button
                      accent="brand"
                      size="md"
                      onClick={() => setIsResolveModalOpen(true)}
                      icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
                    >
                      {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      icon={<IconUsers size={14} strokeWidth={2} />}
                    >
                      {t('detail.reassignBtn', 'Điều chuyển')}
                    </Button>
                  </>
                )}
              </>
            )}

            {isResolved && (
              <div className="flex items-center gap-2">
                <TicketCountdownTimer autoCloseAt={tk.autoCloseAt} resolvedAt={tk.resolvedAt} />
                {!isAdminStationSupervisory && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsResolveModalOpen(true)}
                  >
                    {t('detail.editResolution', 'Cập nhật kết quả')}
                  </Button>
                )}
              </div>
            )}

            {isClosed && (
              <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-sm">
                <IconLock size={14} className="text-faint" />
                <span>{closeReasonMeta?.label || t('status.CLOSED', 'Đã đóng vĩnh viễn')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Contextual Supervisory Banner for Admin on Station Tickets */}
      {isAdminStationSupervisory && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-[12px] text-amber-900 dark:text-amber-200">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold mt-0.5">
            <IconShieldAlert size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[13px]">{t('supervisory.bannerTitle', 'Chế độ Giám sát Trạm sạc (SLA & Kỹ thuật)')}</div>
            <p className="mt-0.5 text-muted leading-relaxed">
              {t('supervisory.bannerDesc', 'Sự cố trạm sạc thuộc trách nhiệm xử lý của Đơn vị vận hành và Kỹ thuật viên trạm {{station}}. Admin thực hiện giám sát tiến độ, ghi nhận kết luận kỹ thuật và bồi hoàn nếu xảy ra lỗi hạ tầng.', {
                station: tk.stationName || t('detail.context.unknownStation', 'Trạm sạc'),
              })}
            </p>
          </div>
        </div>
      )}

      {/* Lifecycle Progress Stepper */}
      <TicketLifecycleStepper ticket={tk} resolvedHandlerName={resolvedHandlerName} />

      {/* BKG-052 Resolution / Closure Policy Banner Bar */}
      {isResolved && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <IconClock size={18} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-amber-900 dark:text-amber-200">
                    {t('detail.resolvedBannerTitle', 'Sự cố đã được đánh dấu giải quyết', {
                      cycle: tk.resolutionCycle ?? 1,
                    })}
                  </span>
                  {tk.autoCloseAt && (
                    <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {t('detail.deadline', 'Hạn chót: {{time}} ngày {{date}}', {
                        time: formatTimeVn(tk.autoCloseAt),
                        date: formatDateVn(tk.autoCloseAt),
                      })}
                    </span>
                  )}
                </div>

                {tk.resolutionReason && (
                  <p className="text-[12.5px] leading-relaxed text-ink">
                    <span className="font-semibold text-muted">{t('detail.resolutionOutcome', 'Kết quả xử lý')}:</span> “{tk.resolutionReason}”
                  </p>
                )}

                <p className="text-[11px] leading-relaxed text-muted italic">
                  * {t('detail.autoClosePolicyDisclaimer', 'Chính sách hỗ trợ: Hệ thống đã gửi thông báo cho tài xế. Nếu không nhận được phản hồi sau 10 ngày, phiếu sẽ tự động đóng theo quy định. Việc đọc thông báo không tính là phản hồi.')}
                </p>
              </div>
            </div>

            <TicketCountdownTimer autoCloseAt={tk.autoCloseAt} resolvedAt={tk.resolvedAt} className="shrink-0" />
          </div>
        </div>
      )}

      {isClosed && (
        <div className="rounded-2xl border border-hairline bg-surface-2/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-chip text-muted">
              <IconLock size={17} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  {t('detail.closedBannerTitle', 'Phiếu hỗ trợ đã được đóng và hoàn tất')}
                </span>
                {closeReasonMeta && (
                  <StatusPill tone={closeReasonMeta.tone} label={closeReasonMeta.label} />
                )}
              </div>
              <p className="text-[12px] text-muted">
                {closeReasonMeta?.description || t('detail.closedHelp', 'Phiếu hỗ trợ này đã hoàn thành. Nếu có thắc mắc hoặc sự cố phát sinh sau thời điểm này, vui lòng tạo phiếu hỗ trợ mới.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Body */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Left Column: Thread & Events (8/12 Desktop) */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="overflow-hidden rounded-2xl">
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 bg-surface-2/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('thread')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    activeTab === 'thread'
                      ? 'bg-surface text-ink shadow-2xs border border-line'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <IconSend size={13} strokeWidth={2} />
                  <span>{t('detail.tabs.thread', 'Luồng trao đổi')}</span>
                  <span className="ml-1 rounded-full bg-chip px-1.5 py-0.2 text-[10px] font-medium text-faint">
                    {messages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('events')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    activeTab === 'events'
                      ? 'bg-surface text-ink shadow-2xs border border-line'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <IconHistory size={13} strokeWidth={2} />
                  <span>{t('detail.tabs.events', 'Nhật ký sự kiện (Audit Trail)')}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {activeTab === 'thread' && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t('live.badge', 'Trực tiếp')}
                    </span>
                    <button
                      type="button"
                      onClick={() => messagesQuery.refetch()}
                      className="p-1 rounded text-muted hover:text-ink hover:bg-surface transition-colors"
                      title={t('live.refreshTooltip', 'Làm mới tin nhắn')}
                    >
                      <IconRefreshCw size={12} className={messagesQuery.isFetching ? 'animate-spin' : ''} />
                    </button>
                  </div>
                )}

                <span className="text-[11px] font-mono text-faint">
                  {tk.resolutionCycle
                    ? t('detail.cycleBadge', 'Lần #{{cycle}}', { cycle: tk.resolutionCycle })
                    : t('detail.cycleInitial', 'Khởi tạo')}
                </span>
              </div>
            </div>

            {/* Tab Content: Thread */}
            {activeTab === 'thread' && (
              <>
                <div className="flex min-h-[340px] max-h-[550px] overflow-y-auto flex-col gap-4 p-4">
                  {messagesQuery.isLoading ? (
                    <>
                      <Skeleton className="h-14 w-3/4" />
                      <Skeleton className="ml-auto h-14 w-3/4" />
                    </>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                      <IconAlertCircle size={28} className="mb-2 text-faint" />
                      <p className="text-[13px] font-medium text-ink">{t('detail.noMessages', 'Chưa có phản hồi nào trong luồng này.')}</p>
                      <p className="text-[11.5px] text-faint">{t('detail.sendFirst', 'Gửi tin nhắn để bắt đầu trao đổi với khách hàng.')}</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((m) => <MessageBubble key={m.id} message={m} accent={accent} />)}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Adaptive Composer or Terminal Sealed Vault */}
                <div className="border-t border-hairline p-3.5 bg-surface-2/40">
                  {isClosed ? (
                    <div className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-[12.5px] text-muted shadow-sm">
                      <IconLock size={16} className="text-faint" />
                      <span>{t('detail.composerClosedNotice', 'Phiếu hỗ trợ này đã được đóng hoàn tất. Không thể gửi thêm tin nhắn phản hồi.')}</span>
                    </div>
                  ) : isResolved ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 px-1">
                        <IconClock size={12} strokeWidth={2.2} />
                        <span>{t('detail.composerResolvedWarning', 'Lưu ý: Gửi thêm tin nhắn trong lúc này sẽ chuyển vé về trạng thái Đang xử lý và hủy hạn đếm ngược 10 ngày.')}</span>
                      </div>
                      <ChatComposer
                        value={draft}
                        onChange={setDraft}
                        onSubmit={() => reply.mutate(draft.trim())}
                        placeholder={t('detail.composerPlaceholder', 'Nhập phản hồi hoặc hướng dẫn xử lý...')}
                        disabled={reply.isPending}
                        accent={accent}
                        actions={
                          <Button
                            accent={accent}
                            size="md"
                            icon={<IconSend size={14} strokeWidth={2.2} />}
                            disabled={!draft.trim() || reply.isPending}
                            onClick={() => reply.mutate(draft.trim())}
                          >
                            {reply.isPending ? t('detail.sending', 'Đang gửi...') : t('detail.send', 'Gửi')}
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <ChatComposer
                      value={draft}
                      onChange={setDraft}
                      onSubmit={() => reply.mutate(draft.trim())}
                      placeholder={t('detail.composerPlaceholder', 'Nhập phản hồi hoặc hướng dẫn xử lý...')}
                      disabled={reply.isPending}
                      accent={accent}
                      actions={
                        <Button
                          accent={accent}
                          size="md"
                          icon={<IconSend size={14} strokeWidth={2.2} />}
                          disabled={!draft.trim() || reply.isPending}
                          onClick={() => reply.mutate(draft.trim())}
                        >
                          {reply.isPending ? t('detail.sending', 'Đang gửi...') : t('detail.send', 'Gửi')}
                        </Button>
                      }
                    />
                  )}
                </div>
              </>
            )}

            {/* Tab Content: Audit Events Timeline */}
            {activeTab === 'events' && <TicketEventTimeline ticketId={id} />}
          </Card>
        </div>

        {/* Right Column: Context, Findings, Refund (4/12 Desktop) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Handler Assignment Inspector (Clean Single-Bezel) */}
          <Card className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <IconUsers size={14} />
                </div>
                <h2 className="text-[13px] font-bold text-ink">
                  {isAdminStationSupervisory
                    ? t('supervisory.stationUnit', 'Đơn vị vận hành trạm')
                    : isAdminPlatformDirect
                    ? t('platformQueue.handlerTitle', 'Chuyên viên Nền tảng')
                    : t('detail.handlerCard.title', 'Người phụ trách')}
                </h2>
              </div>

              {isAssigned ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('detail.handlerCard.activeBadge', 'Đang phụ trách')}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {t('detail.handlerCard.unassignedBadge', 'Chờ phân công')}
                </span>
              )}
            </div>

            {isAssigned ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={resolvedHandlerName || t('detail.handlerCard.techFallback', 'Kỹ thuật viên')} size="md" tone="brand" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-ink text-[13.5px] truncate">
                        {resolvedHandlerName || t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm')}
                      </div>
                      <div className="font-mono text-[11px] text-muted truncate">
                        {tk.assignedHandlerId ? `#${tk.assignedHandlerId.slice(0, 8)}` : t('detail.handlerCard.stationAssigned', 'Trạm phụ trách')} · {isAdminPlatformDirect ? t('platformQueue.handlerTitle', 'Chuyên viên Nền tảng') : t('detail.handlerCard.techRole', 'Kỹ thuật viên')}
                      </div>
                    </div>
                  </div>

                  {!isClosed && !isAdminStationSupervisory && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsAssignDrawerOpen(true)}
                      icon={<IconUsers size={13} strokeWidth={2} />}
                    >
                      {t('detail.handlerCard.changeBtn', 'Điều chuyển')}
                    </Button>
                  )}
                </div>

                {isAdminStationSupervisory && (
                  <div className="rounded-xl bg-surface-2 p-2.5 text-[11.5px] text-muted border border-hairline leading-relaxed">
                    {t('supervisory.stationAssignedNotice', 'Kỹ thuật viên trạm đang trực tiếp kiểm tra và xử lý sự cố thiết bị tại chỗ.')}
                  </div>
                )}

                {(assignedStaff?.email || assignedStaff?.maskedPhone) && (
                  <div className="rounded-xl bg-surface-2 p-2.5 text-[11.5px] text-muted space-y-1 border border-hairline">
                    {assignedStaff.email && (
                      <div className="truncate">
                        <span className="text-faint">Email:</span> {assignedStaff.email}
                      </div>
                    )}
                    {assignedStaff.maskedPhone && (
                      <div className="flex items-center gap-1">
                        <IconPhone size={11} className="text-faint" />
                        <span>{assignedStaff.maskedPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-[12px]">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                    <IconUsers size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                      {t('detail.handlerCard.unassignedTitle', 'Chưa có người phụ trách')}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                      {isAdminStationSupervisory
                        ? t('supervisory.stationUnassignedNotice', 'Chủ trạm hoặc nhân viên trực trạm chịu trách nhiệm tiếp nhận và phân công kỹ thuật viên cho phiếu này.')
                        : isAdminPlatformDirect
                        ? t('platformQueue.unassignedNotice', 'Phiếu sự cố hệ thống đang chờ Chuyên viên Nền tảng tiếp nhận xử lý.')
                        : t('detail.handlerCard.unassignedDesc', 'Phiếu hỗ trợ đang trong hàng đợi xử lý. Quản lý hoặc nhân viên trạm có thể nhận xử lý trực tiếp hoặc phân công cho kỹ thuật viên.')}
                    </p>
                  </div>
                </div>

                {!isClosed && (
                  <div className="mt-3 flex items-center gap-2">
                    {isAdminPlatformDirect ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          accent="brand"
                          size="sm"
                          className="flex-1"
                          disabled={claim.isPending}
                          onClick={() => claim.mutate()}
                          icon={<IconCheck size={14} strokeWidth={2.5} />}
                        >
                          {claim.isPending ? t('detail.claiming', 'Đang nhận...') : t('platformQueue.claimBtn', 'Tiếp nhận')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsAssignDrawerOpen(true)}
                          icon={<IconUsers size={13} />}
                        >
                          {t('detail.assignBtnShort', 'Phân công')}
                        </Button>
                      </div>
                    ) : !admin ? (
                      <>
                        <Button
                          accent="brand"
                          size="sm"
                          className="flex-1"
                          disabled={claim.isPending}
                          onClick={() => claim.mutate()}
                          icon={<IconCheck size={14} strokeWidth={2.5} />}
                        >
                          {claim.isPending ? t('detail.claiming', 'Đang nhận...') : t('detail.claimBtn', 'Tự nhận xử lý')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsAssignDrawerOpen(true)}
                          icon={<IconUsers size={13} />}
                        >
                          {t('detail.assignBtnShort', 'Phân công')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Context Panel */}
          <Card className="rounded-2xl p-4 shadow-sm">
            <h2 className="mb-3 text-[13px] font-bold text-ink">
              {t('detail.context.title', 'Bối cảnh liên quan')}
            </h2>

            <div className="space-y-3 text-[12.5px]">
              <div>
                <div className="text-[11px] font-medium text-muted">{t('detail.context.reporter', 'Người báo cáo')}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Avatar name={tk.reporterName || tk.driverName || 'User'} size="sm" tone="neutral" />
                  <div className="min-w-0">
                    <div className="font-semibold text-ink truncate">{tk.reporterName || tk.driverName || t('actor.driver', 'Tài xế')}</div>
                    {tk.reporterPhone && (
                      <div className="flex items-center gap-1 text-[11.5px] text-muted">
                        <IconPhone size={11} /> {tk.reporterPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isPlatformTicket ? (
                <div className="border-t border-hairline pt-2.5">
                  <div className="text-[11px] font-medium text-muted">{t('detail.context.scope', 'Phạm vi')}</div>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-brand">
                    <IconShield size={13} className="text-brand shrink-0" />
                    <span>{t('detail.context.platformScope', 'Cổng thanh toán & Nền tảng')}</span>
                  </div>
                </div>
              ) : (
                <div className="border-t border-hairline pt-2.5">
                  <div className="text-[11px] font-medium text-muted">{t('detail.context.station', 'Trạm sạc')}</div>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-ink">
                    <IconPin size={13} className="text-faint shrink-0" />
                    <span className="truncate">{tk.stationName || t('detail.context.unknownStation', 'Trạm sạc')}</span>
                  </div>
                </div>
              )}

              {tk.bookingId && (
                <div className="border-t border-hairline pt-2.5">
                  <div className="text-[11px] font-medium text-muted">{t('detail.context.booking', 'Đơn sạc liên kết')}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[12px] font-semibold text-brand truncate">
                      #{String(tk.bookingId).slice(0, 12)}
                    </span>
                    <Link
                      to={admin ? `/admin/bookings` : `/owner/bookings`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                    >
                      <span>{t('detail.context.viewBooking', 'Xem đơn')}</span>
                      <IconArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="border-t border-hairline pt-2.5">
                <div className="text-[11px] font-medium text-muted">{t('detail.context.createdAt', 'Thời điểm khởi tạo')}</div>
                <div className="mt-0.5 text-muted">
                  {t('detail.context.atTime', '{{date}} lúc {{time}}', {
                    date: formatDateVn(tk.createdAt),
                    time: formatTimeVn(tk.createdAt),
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Technical Findings Panel */}
          <Card className="rounded-2xl p-4 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                <IconWrench size={14} className="text-muted" />
                <span>{t('detail.findings.title', 'Kết luận kỹ thuật')}</span>
              </h2>
              {findings.length > 0 && (
                <span className="rounded bg-chip px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
                  {findings.length}
                </span>
              )}
            </div>

            {findings.length === 0 ? (
              <p className="text-[12px] text-muted leading-relaxed">
                {t('detail.findings.empty', 'Chưa có kết luận kỹ thuật nào được ghi nhận cho phiếu này.')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {findings.map((f, idx) => {
                  const metaConclusion = CONCLUSION_LABELS[f.conclusion] || {
                    label: f.conclusion,
                    tone: 'neutral' as const,
                  };
                  return (
                    <div
                      key={f.id || f.findingId || idx}
                      className="rounded-xl border border-line bg-surface p-2.5 text-[12px]"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-ink">
                          {t(`detail.findings.${f.conclusion}`, metaConclusion.label)}
                        </span>
                        <StatusPill tone={metaConclusion.tone} label={t(`detail.findings.${f.conclusion}`, metaConclusion.label)} />
                      </div>
                      {f.reason && <p className="mt-1 text-muted">{f.reason}</p>}
                      <div className="mt-1.5 text-[10.5px] text-faint">
                        {t('detail.findings.recordedAt', 'Ghi nhận: {{time}}', {
                          time: `${formatDateVn(f.recordedAt)} ${formatTimeVn(f.recordedAt)}`,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Refund Status Panel */}
          <Card className="rounded-2xl p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <IconCheckCircle size={15} className="text-good-deep" />
              <span>{t('detail.refund.title', 'Chính sách bồi hoàn cọc')}</span>
            </div>

            {hasRefund ? (
              <div className="rounded-xl border border-good-line bg-good-soft/30 p-3 text-[12px]">
                <div className="font-semibold text-good-deep">
                  {t('detail.refund.autoGranted', 'Đã hoàn cọc 100% tự động')}
                </div>
                <p className="mt-1 text-muted leading-relaxed">
                  {t('detail.refund.desc', 'Hệ thống tự động kích hoạt bồi hoàn do sự cố thuộc trách nhiệm hạ tầng trạm sạc.')}
                </p>
                <div className="mt-2.5 space-y-1">
                  {tk.refundIds?.map((refId) => (
                    <div key={refId} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted">#{refId.slice(0, 10)}...</span>
                      {admin && (
                        <Link
                          to={`/admin/refunds?search=${refId}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {t('detail.refund.viewDetail', 'Chi tiết hoàn tiền →')}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-muted">
                {t('detail.refund.policyNotice', 'Theo chính sách bảo vệ tài xế, nếu sự cố trạm được xác nhận là lỗi phần cứng hoặc ngoại tuyến, tài xế sẽ được hoàn 100% tiền cọc tự động.')}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ResolveTicketModal
        open={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        ticket={tk}
        onSubmit={async (reason) => {
          await resolve.mutateAsync(reason);
        }}
        isPending={resolve.isPending}
        accent={accent}
      />

      <AssignTicketDrawer
        open={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        ticket={tk}
        onSubmit={async (handlerId, reason) => {
          await assign.mutateAsync({ handlerId, reason });
        }}
        isPending={assign.isPending}
        admin={admin}
      />
    </div>
  );
}

function MessageBubble({ message, accent }: { message: TicketMessage; accent: 'brand' | 'owner' }) {
  const { t } = useTranslation('tickets');
  const actor = getActorMeta(message);
  const isMine = actor.isInternal;
  const actorKey = message.authorKind || message.authorRole || 'REPORTER';
  const actorLabel = t(`actor.${actorKey}`, actor.label);

  const bubbleClass = isMine
    ? accent === 'owner'
      ? 'bg-owner-soft border-owner-border'
      : 'bg-brand-soft border-brand-line'
    : 'bg-surface border-line';

  return (
    <div className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={message.authorDisplayName || message.authorName || 'User'} size="sm" tone={isMine ? accent : 'neutral'} />
      <div className={`flex max-w-[80%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-faint">
          <span className="font-semibold text-ink">{message.authorDisplayName || message.authorName || t('detail.senderFallback', 'Người gửi')}</span>
          <span className={`rounded px-1.5 py-0.2 text-[9.5px] font-medium ${actor.badgeClass}`}>
            {actorLabel}
          </span>
          <span>·</span>
          <span>
            {formatDateVn(message.createdAt)} {formatTimeVn(message.createdAt)}
          </span>
        </div>
        <div className={`rounded-2xl border px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-sm ${bubbleClass}`}>
          {message.body}
        </div>
      </div>
    </div>
  );
}
