import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  TICKET_CLOSE_REASON,
  type Ticket,
  type TicketCategory,
  type TicketFinding,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
  type ReviewTicketEscalationPayload,
} from '@chargeops/api';
import { useToast } from '@chargeops/ui';
import { getTicketErrorMeta } from '../utils/ticketErrors';

export interface UseTicketDetailOptions {
  admin?: boolean;
}

export function useTicketDetail({ admin = false }: UseTicketDetailOptions = {}) {
  const { id = '' } = useParams();
  const { t } = useTranslation('tickets');
  const navigate = useNavigate();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const accent: 'brand' | 'owner' = admin ? 'brand' : 'owner';
  const roleOption: 'owner' | 'admin' = admin ? 'admin' : 'owner';

  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'thread' | 'events'>('thread');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number>(0);

  const ticketQuery = useQuery({
    queryKey: ['tickets', 'get', id, roleOption],
    queryFn: () => api.tickets.get(id, { role: roleOption }),
    refetchOnWindowFocus: true,
  });

  const messagesQuery = useQuery({
    queryKey: ['tickets', 'messages', id, roleOption],
    queryFn: () => api.tickets.messages(id, { role: roleOption }),
    refetchOnWindowFocus: true,
  });

  // Danh tính người xem — dùng để nhận diện "tin của mình" theo authorId,
  // không suy ra từ authorKind hay tên hiển thị.
  const profileQuery = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => api.profile.get(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const staffQuery = useQuery({
    queryKey: ['staff', 'station', ticketQuery.data?.stationId],
    queryFn: () => (ticketQuery.data?.stationId ? api.staff.list(ticketQuery.data.stationId) : Promise.resolve([])),
    enabled: !admin && Boolean(ticketQuery.data?.stationId),
  });

  const escalationQuery = useQuery({
    queryKey: ['tickets', 'escalation', id],
    queryFn: async () => {
      try {
        return await api.ticketEscalations.get(id);
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
    retry: false,
  });

  // Note: Message scrolling is managed internally within TicketThreadTab on its self-contained
  // scroll container to prevent scrollIntoView from moving the outer window or page scrollbar.

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
    mutationFn: (body: string) => api.tickets.reply(id, body, { role: roleOption }),
    onSuccess: () => {
      setDraft('');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const claim = useMutation({
    mutationFn: () => api.tickets.claim(id, ticketQuery.data?.version, { role: roleOption }),
    onSuccess: () => {
      toast(t('detail.claimSuccess', 'Bạn đã nhận xử lý vé này thành công!'), 'success');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const assign = useMutation({
    mutationFn: (data: { handlerId: string; reason?: string }) =>
      api.tickets.assign(
        id,
        {
          expectedVersion: ticketQuery.data?.version,
          handlerId: data.handlerId,
          reason: data.reason,
        },
        { role: roleOption }
      ),
    onSuccess: () => {
      toast(t('detail.assignSuccess', 'Phân công nhân viên xử lý thành công!'), 'success');
      setIsAssignDrawerOpen(false);
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const recordFinding = useMutation({
    mutationFn: (data: { conclusion: 'STATION_FAILURE' | 'NOT_STATION_FAILURE'; affectedAt: string; reason: string }) =>
      api.tickets.recordFinding(id, {
        expectedVersion: ticketQuery.data?.version ?? 0,
        ...data,
      }),
    onSuccess: () => {
      toast(t('detail.findings.saved', 'Đã ghi kết luận kỹ thuật.'), 'success');
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const resolve = useMutation({
    mutationFn: (reason: string) =>
      api.tickets.resolve(
        id,
        {
          expectedVersion: ticketQuery.data?.version,
          reason,
        },
        { role: roleOption }
      ),
    onSuccess: () => {
      toast(t('detail.resolveSuccess', 'Đã đánh dấu giải quyết sự cố và gửi thông báo cho tài xế!'), 'success');
      setIsResolveModalOpen(false);
      invalidateAll();
    },
    onError: handleMutationError,
  });

  const escalate = useMutation({
    mutationFn: (reason: string) => api.ticketEscalations.request(id, { reason }),
    onSuccess: () => {
      toast(t('escalation.requestSuccess', 'Đã gửi yêu cầu Admin xem xét.'), 'success');
      setIsEscalateModalOpen(false);
      invalidateAll();
      qc.invalidateQueries({ queryKey: ['tickets', 'escalation', id] });
    },
    onError: handleMutationError,
  });

  const reviewEscalation = useMutation({
    mutationFn: (payload: ReviewTicketEscalationPayload) => {
      const currentStatus = String(ticketQuery.data?.status || 'OPEN').toUpperCase();
      if ((currentStatus === 'CLOSED' || currentStatus === 'RESOLVED') && payload.action !== 'CLOSE_SUPPORT_CASE') {
        throw new Error(t('escalation.cannotReviewClosed', 'Không thể xem xét yêu cầu trên phiếu đã giải quyết hoặc đã đóng.'));
      }
      return api.ticketEscalations.review(id, payload);
    },
    onSuccess: () => {
      toast('Đã lưu kết quả xem xét của Admin.', 'success');
      invalidateAll();
      qc.invalidateQueries({ queryKey: ['tickets', 'escalation', id] });
    },
    onError: handleMutationError,
  });

  const tk = ticketQuery.data;
  const statusKey = (String(tk?.status || 'OPEN').toUpperCase()) as TicketStatus;
  const meta = TICKET_STATUS[statusKey] ?? { label: tk?.status || '', tone: 'neutral' as const };
  const priorityKey = (tk?.priority || 'MEDIUM') as TicketPriority;
  const priorityMeta = TICKET_PRIORITY[priorityKey] || { label: priorityKey, tone: 'neutral' as const };
  const categoryKey = (tk?.category || 'OTHER') as TicketCategory;
  const categoryLabel = TICKET_CATEGORY[categoryKey] ?? tk?.category ?? '';
  const messages: TicketMessage[] = messagesQuery.data ?? tk?.messages ?? [];
  const code = tk?.ticketCode || tk?.ticketNo || (tk?.id ? `TKT-${tk.id.slice(0, 8).toUpperCase()}` : '—');

  const isOpen = statusKey === 'OPEN';
  const isInProgress = statusKey === 'IN_PROGRESS';
  const isResolved = statusKey === 'RESOLVED';
  const isClosed = statusKey === 'CLOSED';
  const hasRefund = Boolean(tk?.refundIds && tk.refundIds.length > 0);
  const findings: TicketFinding[] = tk?.findings ?? [];

  const isStationTicket = Boolean(tk?.stationId) || tk?.category === 'CHARGING_ISSUE' || tk?.category === 'BOOKING';
  const isPlatformTicket = !isStationTicket;
  const isAdminStationSupervisory = admin && isStationTicket;
  const isAdminPlatformDirect = admin && isPlatformTicket;

  const staffList = Array.isArray(staffQuery.data) ? staffQuery.data : [];
  const assignedStaff = tk?.assignedHandlerId
    ? staffList.find((s: any) => s.userId === tk.assignedHandlerId || s.id === tk.assignedHandlerId)
    : undefined;

  const resolvedHandlerName =
    tk?.assignedHandlerName ||
    tk?.assignedToName ||
    assignedStaff?.displayName ||
    assignedStaff?.name ||
    (tk?.assignedHandlerId
      ? `${t('detail.handlerCard.techFallback', 'Kỹ thuật viên')} #${tk.assignedHandlerId.slice(0, 8)}`
      : isInProgress
        ? t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm')
        : null);

  const isAssigned = Boolean(tk?.assignedHandlerId || resolvedHandlerName || isInProgress);
  const closeReasonMeta = tk?.closeReason ? TICKET_CLOSE_REASON[tk.closeReason] : undefined;

  return {
    id,
    admin,
    roleOption,
    accent,
    t,
    navigate,
    ticketQuery,
    messagesQuery,
    staffQuery,
    currentUserId: profileQuery.data?.id,
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
    invalidateAll,
    // Derived ticket state
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
    isStationTicket,
    isPlatformTicket,
    isAdminStationSupervisory,
    isAdminPlatformDirect,
    staffList,
    assignedStaff,
    resolvedHandlerName,
    isAssigned,
    closeReasonMeta,
    escalation: (() => {
      const rawEsc = escalationQuery.data || (tk as any)?.escalation || null;
      if (!rawEsc) return null;
      const baseEsc = (tk as any)?.escalation ?? {};
      const merged = { ...baseEsc, ...rawEsc };
      const requestedByRole =
        merged.requestedByRole ||
        (merged.requestedBy && (merged.requestedBy === tk?.reporterId || merged.requestedBy === tk?.driverId)
          ? 'driver'
          : (tk as any)?.stationOwnerId && merged.requestedBy === (tk as any)?.stationOwnerId
          ? 'owner'
          : undefined);
      return { ...merged, requestedByRole };
    })(),
    isEscalated: Boolean(
      (escalationQuery.data?.ticketId
        ? !escalationQuery.data.resolvedAt
        : (tk as any)?.isEscalated && !(tk as any)?.escalation?.resolvedAt)
    ),
  };
}
