import { useState } from 'react';
import { formatDateVn } from '@chargeops/api';
import {
  Card,
  IconArrowLeft,
  IconHistory,
  IconPin,
  IconRefreshCw,
  IconSend,
  IconShield,
  IconUsers,
  IconWrench,
  Skeleton,
} from '@chargeops/ui';
import {
  AdminRefundPolicyModal,
  AdminRefundPolicyReviewCard,
  AssignTicketDrawer,
  EscalateTicketModal,
  OwnerDisputeAdmissionCard,
  PlatformDirectGuideCard,
  ResolveTicketModal,
  TicketContextCard,
  TicketErrorState,
  TicketFindingsCard,
  TicketHandlerCard,
  TicketHeader,
  TicketLifecycleStepper,
  TicketRefundCard,
  TicketScopeWarning,
  TicketStatusBanners,
  TicketThreadTab,
  TicketEventTimeline,
} from './components';
import { useTicketDetail, type TicketRoleOption } from './hooks/useTicketDetail';
import { ReviewEscalationModal } from './components/ReviewEscalationModal';
import { OwnerAdmitFailureModal } from '../../owner/features/bookings/OwnerAdmitFailureModal';
import type { ReviewTicketEscalationPayload, OwnerBookingDetail } from '@chargeops/api';

export function TicketDetail({
  admin = false,
  role,
}: {
  admin?: boolean;
  role?: TicketRoleOption;
}) {
  const {
    id,
    accent,
    roleOption,
    isStaffRole,
    t,
    navigate,
    ticketQuery,
    messagesQuery,
    currentUserId,
    draft,
    setDraft,
    activeTab,
    setActiveTab,
    isResolveModalOpen,
    setIsResolveModalOpen,
    isAssignDrawerOpen,
    setIsAssignDrawerOpen,
    isEscalateModalOpen,
    setIsEscalateModalOpen,
    messagesEndRef,
    reply,
    claim,
    assign,
    recordFinding,
    resolve,
    escalate,
    reviewEscalation,
    ticket: tk,
    statusKey,
    meta,
    priorityKey,
    priorityMeta,
    categoryKey,
    categoryLabel,
    messages,
    code,
    isOpen,
    isInProgress,
    isResolved,
    isClosed,
    hasRefund,
    findings,
    isPlatformTicket,
    isAdminStationSupervisory,
    isAdminPlatformDirect,
    assignedStaff,
    resolvedHandlerName,
    isAssigned,
    escalation,
    isEscalated,
  } = useTicketDetail({ admin, role });

  const [mobileTab, setMobileTab] = useState<'conversation' | 'records'>('conversation');
  const [reviewAction, setReviewAction] = useState<ReviewTicketEscalationPayload['action'] | null>(null);
  const [isRefundPolicyModalOpen, setIsRefundPolicyModalOpen] = useState(false);
  const [admitBooking, setAdmitBooking] = useState<OwnerBookingDetail | null>(null);

  if (ticketQuery.error) {
    return (
      <TicketErrorState
        error={ticketQuery.error}
        accent={accent}
        onBack={() => navigate('..')}
        onRetry={() => ticketQuery.refetch()}
      />
    );
  }

  if (ticketQuery.isLoading || !tk) {
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

  if (!admin && isPlatformTicket) {
    return <TicketScopeWarning onBack={() => navigate('..')} />;
  }

  const hasCurrentCycleFinding = findings.some(
    (finding) => !tk.resolvedAt || Date.parse(finding.recordedAt) > Date.parse(tk.resolvedAt)
  );

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

      {/* Ticket Header Banner (Clean Single-Bezel) with Action Dock */}
      <TicketHeader
        ticket={tk}
        admin={admin}
        code={code}
        priorityKey={priorityKey}
        priorityMeta={priorityMeta}
        statusKey={statusKey}
        statusMeta={meta}
        categoryKey={categoryKey}
        categoryLabel={categoryLabel}
        hasRefund={hasRefund}
        isEscalated={isEscalated}
        isAdminStationSupervisory={isAdminStationSupervisory}
        isAdminPlatformDirect={isAdminPlatformDirect}
        isOpen={isOpen}
        isInProgress={isInProgress}
        isResolved={isResolved}
        isClosed={isClosed}
        isClaiming={claim.isPending}
        hasFindings={hasCurrentCycleFinding}
        onClaim={() => claim.mutate()}
        onOpenAssign={() => setIsAssignDrawerOpen(true)}
        onOpenResolve={() => setIsResolveModalOpen(true)}
        onOpenEscalate={() => setIsEscalateModalOpen(true)}
        onReviewEscalation={(act) => {
          if (!isEscalated || ((isClosed || isResolved) && act !== 'CLOSE_SUPPORT_CASE')) return;
          setReviewAction(act);
        }}
      />

      {/* Status & Policy Banners */}
      <TicketStatusBanners
        ticket={tk}
        isAdminStationSupervisory={isAdminStationSupervisory}
        isResolved={isResolved}
        isClosed={isClosed}
        isEscalated={isEscalated}
        escalation={escalation}
      />

      {/* Lifecycle Progress Stepper */}
      <TicketLifecycleStepper ticket={tk} resolvedHandlerName={resolvedHandlerName} />

      {/* Mobile Responsive Navigation Switcher (< lg) */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center rounded-xl bg-surface border border-line p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('conversation')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-semibold transition-all ${
              mobileTab === 'conversation'
                ? 'bg-surface-2 text-ink shadow-xs border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <IconSend size={13.5} strokeWidth={2} />
            <span>{t('detail.tabs.thread', 'Luồng trao đổi')}</span>
            <span className="rounded-full bg-chip px-1.5 py-0.2 text-[10px] font-bold text-faint">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('records')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-semibold transition-all ${
              mobileTab === 'records'
                ? 'bg-surface-2 text-ink shadow-xs border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            {isPlatformTicket ? <IconShield size={13.5} strokeWidth={2} /> : <IconWrench size={13.5} strokeWidth={2} />}
            <span>
              {isPlatformTicket
                ? t('detail.mobileTabs.platformRecords', 'Hồ sơ & Hướng dẫn')
                : t('detail.mobileTabs.records', 'Hồ sơ & Biên bản')}
            </span>
            {findings.length > 0 && (
              <span className="rounded-full bg-chip px-1.5 py-0.2 text-[10px] font-bold text-muted">
                {findings.length}
              </span>
            )}
            {isEscalated && (
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            )}
          </button>
        </div>

        {/* Quick Context Strip on Mobile (Visible when viewing conversation to glance at station/handler) */}
        {mobileTab === 'conversation' && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface/80 border border-hairline text-[11.5px] text-muted">
            <div className="flex items-center gap-3 truncate min-w-0">
              <span className="inline-flex items-center gap-1 font-medium text-ink truncate">
                <IconPin size={11} className="text-faint shrink-0" />
                <span className="truncate">{tk.stationName || t('detail.context.platformScope', 'Nền tảng')}</span>
              </span>
              <span className="text-faint">·</span>
              <span className="inline-flex items-center gap-1 truncate">
                <IconUsers size={11} className="text-faint shrink-0" />
                <span className="truncate">{resolvedHandlerName || t('detail.handlerCard.unassignedBadge', 'Chờ phân công')}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('records')}
              className="text-[11px] font-semibold text-brand hover:underline shrink-0"
            >
              {t('detail.mobileTabs.viewRecords', 'Chi tiết hồ sơ →')}
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Body */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Left Column: Thread & Events (8/12 Desktop, toggled on mobile) */}
        <div className={`space-y-4 lg:col-span-8 ${mobileTab === 'conversation' ? 'block' : 'hidden lg:block'}`}>
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
                    <button
                      type="button"
                      onClick={() => {
                        void messagesQuery.refetch();
                        void ticketQuery.refetch();
                      }}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-muted hover:text-ink hover:bg-surface border border-line transition-colors"
                      title={t('live.refreshTooltip', 'Làm mới tin nhắn')}
                    >
                      <IconRefreshCw
                        size={12}
                        className={messagesQuery.isFetching || ticketQuery.isFetching ? 'animate-spin' : ''}
                      />
                      <span>{t('detail.refresh', 'Làm mới')}</span>
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
              <TicketThreadTab
                messages={messages}
                isLoading={messagesQuery.isLoading}
                draft={draft}
                onDraftChange={setDraft}
                onSend={(text) => reply.mutate(text)}
                isSending={reply.isPending}
                isResolved={isResolved}
                isClosed={isClosed}
                readOnlyNotice={isAdminStationSupervisory && !isEscalated
                  ? 'Admin chỉ tham gia trao đổi khi yêu cầu xem xét đang mở.'
                  : undefined}
                accent={accent}
                currentUserId={currentUserId}
                messagesEndRef={messagesEndRef}
              />
            )}

            {/* Tab Content: Audit Events Timeline */}
            {activeTab === 'events' && <TicketEventTimeline ticketId={id} role={roleOption} />}
          </Card>
        </div>

        {/* Right Column: Context, Findings, Refund (4/12 Desktop, toggled on mobile) */}
        <div className={`space-y-4 lg:col-span-4 ${mobileTab === 'records' ? 'block' : 'hidden lg:block'}`}>
          <TicketHandlerCard
            ticket={tk}
            admin={admin}
            canAssign={!isStaffRole}
            isAdminStationSupervisory={isAdminStationSupervisory}
            isAdminPlatformDirect={isAdminPlatformDirect}
            isAssigned={isAssigned}
            isClosed={isClosed}
            isResolved={isResolved}
            resolvedHandlerName={resolvedHandlerName}
            assignedStaff={assignedStaff}
            isClaiming={claim.isPending}
            onClaim={() => claim.mutate()}
            onOpenAssign={() => setIsAssignDrawerOpen(true)}
          />

          <TicketContextCard
            ticket={tk}
            admin={admin}
            isPlatformTicket={isPlatformTicket}
          />

          {/* Platform Direct Queue Guide Card (Dedicated for Platform Specialist) */}
          {(isAdminPlatformDirect || isPlatformTicket) && (
            <PlatformDirectGuideCard ticket={tk} />
          )}

          {/* TicketFindingsCard is ONLY for station tickets that have station and booking context */}
          {Boolean(tk.stationId && tk.bookingId) && (
            <TicketFindingsCard
              findings={findings}
              canRecord={Boolean(
                tk.stationId &&
                tk.bookingId &&
                !isClosed &&
                (admin
                  ? false
                  : (!isResolved && !isEscalated && (isOpen || isInProgress)))
              )}
              isPending={recordFinding.isPending}
              onRecord={async (conclusion, affectedAt, reason) => {
                await recordFinding.mutateAsync({ conclusion, affectedAt, reason });
              }}
              isClosed={isClosed}
              isResolved={isResolved}
              isEscalated={isEscalated}
              escalatedAt={escalation?.requestedAt || (tk as any)?.escalatedAt}
              admin={admin}
              accent={accent}
            />
          )}

          {/* Admin Refund Policy Review Card (BKG-057): For arbitrating dispute refund policy */}
          {Boolean(admin && isEscalated && tk.bookingId) && (
            <AdminRefundPolicyReviewCard
              ticket={tk}
              escalation={escalation}
              admin={admin}
              onOpenReviewModal={() => setIsRefundPolicyModalOpen(true)}
            />
          )}

          {/* Owner Proactive Dispute Admission Card (BKG-056): Proactive failure admission in escalation */}
          {Boolean(!admin && !isStaffRole && isEscalated && tk.bookingId) && (
            <OwnerDisputeAdmissionCard
              ticket={tk}
              onOpenAdmitModal={(booking) => setAdmitBooking(booking)}
            />
          )}

          {/* TicketRefundCard: only on station tickets or when refund record exists */}
          {(hasRefund || (!isPlatformTicket && !isAdminPlatformDirect)) && (
            <TicketRefundCard
              ticket={tk}
              admin={admin}
              hasRefund={hasRefund}
            />
          )}
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
        hasFindings={hasCurrentCycleFinding}
        isEscalated={isEscalated}
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

      <EscalateTicketModal
        open={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        ticket={tk}
        onSubmit={async (reason) => {
          await escalate.mutateAsync(reason);
        }}
        isPending={escalate.isPending}
      />

      {reviewAction && isEscalated && (
        <ReviewEscalationModal
          open
          action={reviewAction}
          pending={reviewEscalation.isPending}
          onClose={() => setReviewAction(null)}
          onSubmit={async (note, closureReason) => {
            await reviewEscalation.mutateAsync({
              expectedVersion: tk.version ?? 0,
              action: reviewAction,
              closureReason,
              note,
            });
            setReviewAction(null);
          }}
        />
      )}

      {/* Admin Refund Policy Review Modal (BKG-057) */}
      {isRefundPolicyModalOpen && Boolean(admin && isEscalated && tk.bookingId) && (
        <AdminRefundPolicyModal
          open={isRefundPolicyModalOpen}
          onClose={() => setIsRefundPolicyModalOpen(false)}
          ticket={tk}
          escalation={escalation}
          onSuccess={() => {
            void ticketQuery.refetch();
          }}
        />
      )}

      {/* Owner Admit Station Failure Modal (BKG-056) */}
      {admitBooking && (
        <OwnerAdmitFailureModal
          open={Boolean(admitBooking)}
          onClose={() => setAdmitBooking(null)}
          booking={admitBooking}
          onSuccess={() => {
            setAdmitBooking(null);
            void ticketQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
