import { formatDateVn } from '@chargeops/api';
import {
  Card,
  IconArrowLeft,
  IconHistory,
  IconRefreshCw,
  IconSend,
  Skeleton,
} from '@chargeops/ui';
import {
  AssignTicketDrawer,
  EscalateTicketModal,
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
import { useTicketDetail } from './hooks/useTicketDetail';

export function TicketDetail({ admin = false }: { admin?: boolean }) {
  const {
    id,
    accent,
    roleOption,
    t,
    navigate,
    ticketQuery,
    messagesQuery,
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
  } = useTicketDetail({ admin });

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
        onClaim={() => claim.mutate()}
        onOpenAssign={() => setIsAssignDrawerOpen(true)}
        onOpenResolve={() => setIsResolveModalOpen(true)}
        onOpenEscalate={() => setIsEscalateModalOpen(true)}
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
                      <IconRefreshCw
                        size={12}
                        className={messagesQuery.isFetching ? 'animate-spin' : ''}
                      />
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
                accent={accent}
                messagesEndRef={messagesEndRef}
              />
            )}

            {/* Tab Content: Audit Events Timeline */}
            {activeTab === 'events' && <TicketEventTimeline ticketId={id} role={roleOption} />}
          </Card>
        </div>

        {/* Right Column: Context, Findings, Refund (4/12 Desktop) */}
        <div className="space-y-4 lg:col-span-4">
          <TicketHandlerCard
            ticket={tk}
            admin={admin}
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

          <TicketFindingsCard
            findings={findings}
            canRecord={Boolean(tk.stationId && tk.bookingId)}
            isPending={recordFinding.isPending}
            onRecord={async (conclusion, affectedAt, reason) => {
              await recordFinding.mutateAsync({ conclusion, affectedAt, reason });
            }}
          />

          <TicketRefundCard
            ticket={tk}
            admin={admin}
            hasRefund={hasRefund}
          />
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

      <EscalateTicketModal
        open={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        ticket={tk}
        onSubmit={async (reason) => {
          await escalate.mutateAsync(reason);
        }}
        isPending={escalate.isPending}
      />
    </div>
  );
}
