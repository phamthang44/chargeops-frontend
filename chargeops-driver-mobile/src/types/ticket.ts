/**
 * Support Ticket Data Contracts (FE-13 / BKG-050 / BKG-051).
 */

export type TicketCategory = 'CHARGING_ISSUE' | 'BOOKING' | 'PAYMENT' | 'ACCOUNT' | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Lý do đóng phiếu — Driver chủ động xác nhận hoặc hệ thống tự đóng sau hạn.
 */
export type TicketCloseReason = 'REPORTER_CONFIRMED' | 'AUTO_CLOSED_NO_RESPONSE' | string;

export type TicketActorKind = 'REPORTER' | 'OWNER' | 'STAFF' | 'ADMIN';

export type TicketFindingConclusion =
  | 'STATION_FAILURE'
  | 'NOT_STATION_FAILURE'
  | 'HARDWARE_FAULT'
  | 'STATION_OFFLINE'
  | 'SOFTWARE_BUG'
  | 'USER_ERROR'
  | 'OTHER';

export interface TicketMessage {
  messageId: string;
  authorId?: string;
  authorDisplayName: string;
  authorKind: TicketActorKind;
  body: string;
  createdAt: string;
}

export interface TicketFinding {
  findingId: string;
  conclusion: TicketFindingConclusion;
  affectedAt: string;
  reason: string;
  recordedAt: string;
  recordedBy?: string | null;
}

export interface Ticket {
  ticketId: string;
  ticketCode: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  status: TicketStatus;
  version: number;
  bookingId?: string | null;
  stationId?: string | null;
  stationName?: string | null;
  reporterId: string;
  assignedHandlerId?: string | null;
  createdAt: string;
  isEscalated?: boolean;
  escalatedAt?: string | null;
  escalation?: TicketEscalation | null;
  escalationAvailability?: { canRequest: boolean; availableAt?: string | null; reason?: string | null } | null;
  resolutionCycle?: number;
  autoCloseAt?: string | null;
  resolvedAt?: string | null;
  messages: TicketMessage[];
  findings: TicketFinding[];
  refundIds: string[];
  /** Lý do đóng phiếu: 'REPORTER_CONFIRMED' | 'AUTO_CLOSED_NO_RESPONSE' */
  closeReason?: TicketCloseReason | null;
  /** ID người đã resolve (để phân biệt ai xác nhận) */
  resolvedBy?: string | null;
}

export interface CreateTicketPayload {
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  bookingId?: string | null;
  stationId?: string | null;
}

export interface TicketListParams {
  page?: number;
  size?: number;
  status?: TicketStatus | 'ALL';
  stationId?: string;
  /**
   * Phân vùng server: 'reporter' chỉ trả ticket do chính tôi báo cáo
   * (không gian Driver — "Phiếu tôi đã báo").
   */
  scope?: 'actor' | 'reporter';
}

export interface TicketListResult {
  items: Ticket[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TicketEscalation {
  ticketId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionType?: 'RETURN_TO_STATION' | 'CLOSE_SUPPORT_CASE' | null;
  resolutionNote?: string | null;
  closureReason?: string | null;
}

export interface EscalateTicketPayload {
  reason: string;
}
