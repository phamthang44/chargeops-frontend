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
  | 'STATION_FAULT'
  | 'USER_ERROR'
  | 'VEHICLE_FAULT'
  | 'POWER_OUTAGE'
  | 'FORCE_MAJEURE'
  | 'NO_ISSUE';

export interface TicketMessage {
  messageId: string;
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
}

export interface EscalateTicketPayload {
  reason: string;
}
