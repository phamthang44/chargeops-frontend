import type {
  CreateTicketPayload,
  Ticket,
  TicketActorKind,
  TicketListParams,
  TicketListResult,
  TicketMessage,
  TicketEscalation,
} from '@/types';
import { parseSafeDate } from '@/utils/format';
import { apiBaseUrl, isMockMode, resolveAccessToken } from './stationService';

/**
 * In-memory mock store: khởi tạo rỗng mặc định.
 * Chỉ lưu trữ các phiếu được tạo trong phiên khi bật chế độ Mock (EXPO_PUBLIC_USE_MOCKS='true').
 * Tránh hoàn toàn việc hiển thị dữ liệu giả định khi người dùng thật chưa tạo phiếu nào.
 */
let mockTickets: Ticket[] = [];

/** Cho phép nạp dữ liệu mẫu có chủ đích nếu cần phục vụ test chụp màn hình demo */
export function __seedDemoMockTickets(seed: Ticket[]) {
  mockTickets = [...seed];
}

/** Xoá sạch mock store về rỗng */
export function __clearMockTickets() {
  mockTickets = [];
}

/** Tạo UUIDv4 cho Client-Message-Id tùy chọn của tin nhắn ticket */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUUID(str?: string | null): boolean {
  return Boolean(
    str &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  );
}

export function toValidUUID(input?: string | null): string {
  if (!input) return generateUUID();
  if (isUUID(input)) return input;
  const stripped = input.replace(/^temp-/, '');
  if (isUUID(stripped)) return stripped;
  return generateUUID();
}

export class TicketServiceError extends Error {
  code?: string;
  messageKey?: string;
  status?: number;

  constructor(message: string, code?: string, messageKey?: string, status?: number) {
    super(message);
    this.name = 'TicketServiceError';
    this.code = code;
    this.messageKey = messageKey;
    this.status = status;
  }
}

export function getLocalizedTicketErrorMessage(err: any, t: any): string {
  const code = (err?.code || '').toUpperCase();
  const key = err?.messageKey || '';
  const msg = String(err?.message || err || '').trim();

  if (
    code === 'TKT_ACCESS_DENIED' ||
    key === 'error.ticket.accessDenied' ||
    msg.includes('You do not have access to this support ticket') ||
    msg.includes('accessDenied')
  ) {
    return t('ticket.errors.accessDenied', 'Bạn không có quyền truy cập hoặc thực hiện thao tác trên phiếu hỗ trợ này.');
  }

  if (
    code === 'TKT_NOT_FOUND' ||
    key === 'error.ticket.notFound' ||
    msg.includes('Support ticket was not found')
  ) {
    return t('ticket.errors.notFound', 'Không tìm thấy phiếu hỗ trợ được yêu cầu.');
  }

  if (
    code === 'TKT_CLOSED' ||
    key === 'error.ticket.closed' ||
    msg.includes('A closed support ticket cannot receive new messages')
  ) {
    return t('ticket.errors.closed', 'Phiếu hỗ trợ đã đóng hoàn tất, không thể gửi thêm tin nhắn.');
  }

  if (
    code === 'TKT_VERSION_CONFLICT' ||
    key === 'error.ticket.versionConflict' ||
    msg.includes('Support ticket data changed')
  ) {
    return t('ticket.errors.versionConflict', 'Dữ liệu phiếu đã thay đổi. Vui lòng vuốt xuống để làm mới.');
  }

  if (code === 'TKT_STATE_CONFLICT' || key === 'error.ticket.stateConflict') {
    return t('ticket.errors.stateConflict', 'Trạng thái phiếu hiện tại không thể thực hiện thao tác này.');
  }

  if (code === 'TKT_INVALID_SCOPE' || key === 'error.ticket.invalidScope') {
    return t('ticket.errors.invalidScope', 'Đơn đặt chỗ hoặc trạm sạc không khớp với phiếu hỗ trợ này. Vui lòng kiểm tra lại phiên sạc đã chọn.');
  }

  if (
    code === 'TKT_CLAIM_REQUIRED' ||
    code === 'CLAIM_REQUIRED' ||
    key === 'error.ticket.claimRequired' ||
    msg.includes('Claim this support ticket before sending a reply')
  ) {
    return t('ticket.errors.claimRequired', 'Bạn cần tiếp nhận xử lý phiếu trước khi gửi tin nhắn phản hồi.');
  }

  if (
    code === 'TKT_NOT_CURRENT_HANDLER' ||
    code === 'NOT_CURRENT_HANDLER' ||
    key === 'error.ticket.notCurrentHandler' ||
    msg.includes('assigned to another handler') ||
    msg.includes('only the current handler can reply')
  ) {
    return t('ticket.errors.notCurrentHandler', 'Phiếu hỗ trợ đang do nhân sự khác phụ trách; chỉ người phụ trách hiện tại mới có quyền phản hồi.');
  }

  if (
    code === 'SYS_003' ||
    code === 'VALIDATION_FAILED' ||
    code === 'INVALID_REQUEST' ||
    key === 'validation.failed' ||
    key === 'error.validation' ||
    msg.toLowerCase().includes('validation failed') ||
    msg.toLowerCase().includes('invalid uuid string')
  ) {
    return t(
      'ticket.errors.validationFailed',
      'Dữ liệu gửi lên không hợp lệ hoặc thiếu thông tin bắt buộc. Vui lòng kiểm tra lại.'
    );
  }

  if (
    code === 'SYS_001' ||
    code === 'SYS_002' ||
    key === 'common.internalError' ||
    key === 'common.databaseError'
  ) {
    return t(
      'ticket.errors.internalError',
      'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát.'
    );
  }

  return msg || t('ticket.errors.generic', 'Đã xảy ra lỗi khi xử lý phiếu hỗ trợ.');
}

function buildTicketError(res: Response, errJson: any, fallbackMessage: string): TicketServiceError {
  const code = errJson?.error?.code || errJson?.code;
  const messageKey = errJson?.error?.messageKey || errJson?.messageKey;
  const message = errJson?.error?.message || errJson?.message || fallbackMessage;
  return new TicketServiceError(message, code, messageKey, res.status);
}


/**
 * Tạo phiếu hỗ trợ / báo sự cố mới (POST /api/v1/tickets)
 */
export async function createTicket(
  payload: CreateTicketPayload,
  accessToken?: string | null
): Promise<Ticket> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, `Lỗi tạo phiếu: ${res.status}`);
  }

  // Mock implementation (chỉ chạy khi EXPO_PUBLIC_USE_MOCKS='true')
  const now = new Date().toISOString();
  const newTicket: Ticket = {
    ticketId: generateUUID(),
    ticketCode: `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mockTickets.length + 1).padStart(4, '0')}`,
    category: payload.category,
    priority: payload.priority,
    subject: payload.subject,
    status: 'OPEN',
    version: 0,
    bookingId: payload.bookingId ?? null,
    stationId: payload.stationId ?? null,
    reporterId: 'current-user-id',
    assignedHandlerId: null,
    createdAt: now,
    messages: [
      {
        messageId: generateUUID(),
        authorDisplayName: 'Tài xế (Bạn)',
        authorKind: 'REPORTER',
        body: payload.description,
        createdAt: now,
      },
    ],
    findings: [],
    refundIds: [],
  };
  mockTickets.unshift(newTicket);
  return newTicket;
}

/**
 * Lấy danh sách phiếu hỗ trợ của tài xế (GET /api/v1/tickets)
 */
export async function getTickets(
  params?: TicketListParams,
  accessToken?: string | null
): Promise<TicketListResult> {
  const page = params?.page ?? 1;
  const size = params?.size ?? 20;

  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('size', String(size));
    if (params?.status && params.status !== 'ALL') {
      query.set('status', params.status);
    }
    if (params?.stationId) {
      query.set('stationId', params.stationId);
    }
    if (params?.scope) {
      query.set('scope', params.scope === 'reporter' ? 'REPORTER' : 'ACTOR');
    }

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets?${query.toString()}`, { headers });
    if (res.ok) {
      const json = await res.json();
      const rawItems = json?.data ?? [];
      const items = rawItems.map(normalizeTicket);
      const meta = json?.meta ?? {};
      return {
        items,
        page: meta.page ?? page,
        size: meta.size ?? size,
        totalElements: meta.totalElements ?? items.length,
        totalPages: meta.totalPages ?? 1,
      };
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, `Lỗi tải danh sách phiếu: ${res.status}`);
  }

  // Mock implementation (chỉ chạy khi EXPO_PUBLIC_USE_MOCKS='true')
  let filtered = [...mockTickets];
  if (params?.status && params.status !== 'ALL') {
    filtered = filtered.filter((t) => t.status === params.status);
  }
  if (params?.stationId) {
    filtered = filtered.filter((t) => t.stationId === params.stationId);
  }

  const start = (page - 1) * size;
  const items = filtered.slice(start, start + size);
  return {
    items,
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size) || 1,
  };
}

/**
 * Chuẩn hóa đối tượng Ticket từ TicketDetailResponse hoặc TicketResponse
 */
export function normalizeTicket(rawInput: any): Ticket {
  if (!rawInput) return rawInput;
  const raw = rawInput?.data ?? rawInput;

  // Hỗ trợ cấu trúc TicketDetailResponse mới từ backend (overview, station, booking, conversation, resolution)
  if (raw.overview) {
    const o = raw.overview || {};
    const st = raw.station || {};
    const bk = raw.booking || {};
    const pt = raw.participants || {};
    const cv = raw.conversation || {};
    const rs = raw.resolution || {};

    const rawCreatedAt = o.createdAt ?? raw.createdAt;
    const dateObj = parseSafeDate(rawCreatedAt);
    const createdAtIso = dateObj ? dateObj.toISOString() : new Date().toISOString();

    const rawMessages = cv.messages ?? raw.messages;
    const messages: TicketMessage[] = Array.isArray(rawMessages)
      ? rawMessages.map((m: any) => {
          const mDate = parseSafeDate(m?.createdAt);
          return {
            messageId: m?.messageId || m?.id || '',
            authorId: m?.authorId,
            authorDisplayName: m?.authorDisplayName || 'Hệ thống',
            authorKind: m?.authorKind || 'STAFF',
            body: m?.body || '',
            createdAt: mDate ? mDate.toISOString() : new Date().toISOString(),
          };
        })
      : [];

    const rawEsc = raw.escalation || o.escalation || null;
    const esc = rawEsc && typeof rawEsc === 'object' && rawEsc.ticketId ? rawEsc : null;
    const isEsc = Boolean(esc ? !esc.resolvedAt : (raw.isEscalated || o.isEscalated));

    return {
      ticketId: o.ticketId || raw.ticketId || '',
      ticketCode: o.ticketCode || raw.ticketCode || (o.ticketId ? `TKT-${String(o.ticketId).slice(0, 8).toUpperCase()}` : ''),
      category: o.category || raw.category || 'OTHER',
      priority: o.priority || raw.priority || 'MEDIUM',
      subject: o.subject || raw.subject || raw.title || 'Phiếu hỗ trợ',
      status: o.status || raw.status || 'OPEN',
      version: typeof o.version === 'number' ? o.version : (typeof raw.version === 'number' ? raw.version : 0),
      bookingId: bk.bookingId || raw.bookingId,
      stationId: st.stationId || raw.stationId,
      stationName: st.name || raw.stationName,
      reporterId: pt.reporterId || raw.reporterId,
      assignedHandlerId: pt.assignedHandlerId || raw.assignedHandlerId,
      createdAt: createdAtIso,
      isEscalated: isEsc,
      escalatedAt: esc?.requestedAt || raw.escalatedAt || null,
      escalation: esc,
      escalationAvailability: raw.escalationAvailability ?? null,
      resolutionCycle: typeof rs.resolutionCycle === 'number' ? rs.resolutionCycle : (typeof raw.resolutionCycle === 'number' ? raw.resolutionCycle : 0),
      autoCloseAt: rs.autoCloseAt || raw.autoCloseAt || null,
      resolvedAt: rs.resolvedAt || raw.resolvedAt || null,
      closeReason: rs.closeReason || raw.closeReason || null,
      resolvedBy: rs.resolvedBy || raw.resolvedBy || null,
      messages,
      findings: Array.isArray(rs.findings) ? rs.findings : (Array.isArray(raw.findings) ? raw.findings : []),
      refundIds: Array.isArray(rs.refundIds) ? rs.refundIds.map(String) : (Array.isArray(raw.refundIds) ? raw.refundIds.map(String) : []),
    };
  }

  // Cấu trúc phẳng cũ hoặc list item
  const rawCreatedAt = raw.createdAt;
  const dateObj = parseSafeDate(rawCreatedAt);
  const createdAtIso = dateObj ? dateObj.toISOString() : new Date().toISOString();
  const rawEsc = raw.escalation || null;
  const esc = rawEsc && typeof rawEsc === 'object' && rawEsc.ticketId ? rawEsc : null;

  const rawMessages = raw.messages;
  const messages: TicketMessage[] = Array.isArray(rawMessages)
    ? rawMessages.map((m: any) => {
        const mDate = parseSafeDate(m?.createdAt);
        return {
          messageId: m?.messageId || m?.id || '',
          authorId: m?.authorId,
          authorDisplayName: m?.authorDisplayName || 'Hệ thống',
          authorKind: m?.authorKind || 'STAFF',
          body: m?.body || '',
          createdAt: mDate ? mDate.toISOString() : new Date().toISOString(),
        };
      })
    : [];

  return {
    ...raw,
    ticketId: raw.ticketId || raw.id || '',
    ticketCode: raw.ticketCode || (raw.ticketId ? `TKT-${String(raw.ticketId).slice(0, 8).toUpperCase()}` : ''),
    subject: raw.subject || raw.title || 'Phiếu hỗ trợ',
    status: raw.status || 'OPEN',
    createdAt: createdAtIso,
    closeReason: raw.closeReason || null,
    resolvedBy: raw.resolvedBy || null,
    messages,
    findings: Array.isArray(raw.findings) ? raw.findings : [],
    refundIds: Array.isArray(raw.refundIds) ? raw.refundIds.map(String) : [],
    isEscalated: Boolean(esc ? !esc.resolvedAt : Boolean(raw.isEscalated)),
    escalation: esc,
  };
}

/**
 * Lấy chi tiết phiếu hỗ trợ kèm messages & findings (GET /api/v1/tickets/:ticketId)
 */
export async function getTicketDetail(
  ticketId: string,
  accessToken?: string | null
): Promise<Ticket> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // scope=reporter: server chặn quyền đọc nếu ticket không do mình báo cáo
    // (contextual authorization — không gian Driver không thấy dữ liệu Owner/Staff).
    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}?scope=REPORTER`, { headers });
    if (res.ok) {
      const json = await res.json();
      const raw = json?.data ?? json;
      return normalizeTicket(raw);
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không tìm thấy phiếu');
  }

  // Mock implementation (chỉ chạy khi EXPO_PUBLIC_USE_MOCKS='true')
  const found = mockTickets.find((t) => t.ticketId === ticketId);
  if (!found) {
    throw new Error('Phiếu hỗ trợ không tồn tại');
  }
  return found;
}

/**
 * Lấy danh sách tin nhắn của phiếu hỗ trợ (GET /api/v1/tickets/:ticketId/messages)
 */
export async function getTicketMessages(
  ticketId: string,
  accessToken?: string | null
): Promise<TicketMessage[]> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/messages?scope=REPORTER`, { headers });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data ?? json ?? [];
      return Array.isArray(list)
        ? list.map((m: any) => {
            const mDate = parseSafeDate(m?.createdAt);
            return {
              messageId: m?.messageId || m?.id || '',
              authorId: m?.authorId,
              authorDisplayName: m?.authorDisplayName || 'Hệ thống',
              authorKind: m?.authorKind || 'STAFF',
              body: m?.body || '',
              createdAt: mDate ? mDate.toISOString() : new Date().toISOString(),
            };
          })
        : [];
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không lấy được danh sách tin nhắn');
  }

  const ticket = await getTicketDetail(ticketId, accessToken);
  return ticket.messages || [];
}

/**
 * Phản hồi thêm tin nhắn vào phiếu (POST /api/v1/tickets/:ticketId/messages)
 * Có thể kèm Client-Message-Id để tránh lưu hai bản ghi khi cùng request được gửi lại
 */
export async function replyTicket(
  ticketId: string,
  body: string,
  clientMessageId?: string,
  accessToken?: string | null
): Promise<TicketMessage> {
  const effectiveKey = toValidUUID(clientMessageId);

  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-Message-Id': effectiveKey,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });

    if (res.ok) {
      const json = await res.json();
      const raw = json?.data ?? json;
      return {
        messageId: String(raw.messageId || raw.id || effectiveKey),
        authorId: raw.authorId,
        authorDisplayName: raw.authorDisplayName || 'Bạn',
        authorKind: (raw.authorKind as TicketActorKind) || 'REPORTER',
        body: raw.body || body,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      };
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không thể gửi phản hồi');
  }

  // Mock implementation (chỉ chạy khi EXPO_PUBLIC_USE_MOCKS='true')
  const ticket = mockTickets.find((t) => t.ticketId === ticketId);
  if (!ticket) {
    throw new Error('Phiếu hỗ trợ không tồn tại');
  }
  if (ticket.status === 'CLOSED') {
    throw new Error('Phiếu hỗ trợ đã đóng, không thể gửi thêm phản hồi');
  }

  const newMessage: TicketMessage = {
    messageId: effectiveKey,
    authorDisplayName: 'Tài xế (Bạn)',
    authorKind: 'REPORTER',
    body,
    createdAt: new Date().toISOString(),
  };
  ticket.messages.push(newMessage);
  return newMessage;
}

/**
 * Gửi yêu cầu chuyển case lên Ban Quản Trị ChargeOps để phân xử
 * POST /api/v1/tickets/{ticketId}/escalation
 */
export async function escalateTicket(
  ticketId: string,
  reason: string,
  accessToken?: string | null
): Promise<TicketEscalation> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/escalation`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });

    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không thể gửi khiếu nại lên ban quản trị');
  }

  return {
    ticketId,
    requestedBy: 'current-driver',
    requestedAt: new Date().toISOString(),
    reason,
  };
}

export const requestTicketEscalation = escalateTicket;

/**
 * Lấy thông tin đơn chuyển case đã gửi (nếu có)
 * GET /api/v1/tickets/{ticketId}/escalation
 */
export async function getTicketEscalation(
  ticketId: string,
  accessToken?: string | null
): Promise<TicketEscalation | null> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/escalation`, {
      method: 'GET',
      headers,
    });

    if (res.ok) {
      const json = await res.json();
      const raw = json && typeof json === 'object' && 'data' in json ? json.data : json;
      return raw && typeof raw === 'object' && raw.ticketId ? raw : null;
    }
    if (res.status === 404) return null;
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không thể kiểm tra trạng thái khiếu nại');
  }

  return null;
}

/**
 * Driver xác nhận phiếu đã giải quyết: RESOLVED → CLOSED
 * PATCH /api/v1/tickets/{ticketId}/status
 * Body: { status: 'CLOSED', expectedVersion }
 * Ghi audit reason: REPORTER_CONFIRMED
 */
export async function confirmTicketClosed(
  ticketId: string,
  expectedVersion: number,
  accessToken?: string | null
): Promise<Ticket> {
  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'CLOSED', expectedVersion }),
    });

    if (res.ok) {
      const json = await res.json();
      const raw = json?.data ?? json;
      return normalizeTicket(raw);
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không thể xác nhận phiếu đã giải quyết');
  }

  // Mock implementation
  const ticket = mockTickets.find((t) => t.ticketId === ticketId);
  if (!ticket) throw new Error('Phiếu hỗ trợ không tồn tại');
  if (ticket.status !== 'RESOLVED') throw new Error('Chỉ xác nhận phiếu ở trạng thái RESOLVED');
  ticket.status = 'CLOSED';
  ticket.closeReason = 'REPORTER_CONFIRMED';
  ticket.version = (ticket.version || 0) + 1;
  return ticket;
}

/** Driver explicitly reports that the issue remains: RESOLVED → IN_PROGRESS. */
export async function continueTicket(
  ticketId: string,
  expectedVersion: number,
  reason: string,
  accessToken?: string | null
): Promise<Ticket> {
  const explanation = reason.trim();
  if (!explanation) throw new Error('Vui lòng mô tả vấn đề vẫn còn');

  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'IN_PROGRESS', expectedVersion, reason: explanation }),
    });

    if (res.ok) {
      const json = await res.json();
      return normalizeTicket(json?.data ?? json);
    }
    const errJson = await res.json().catch(() => null);
    throw buildTicketError(res, errJson, 'Không thể báo vấn đề vẫn còn');
  }

  const ticket = mockTickets.find((item) => item.ticketId === ticketId);
  if (!ticket) throw new Error('Phiếu hỗ trợ không tồn tại');
  if (ticket.status !== 'RESOLVED') throw new Error('Chỉ mở lại phiếu ở trạng thái RESOLVED');
  ticket.status = 'IN_PROGRESS';
  ticket.autoCloseAt = null;
  ticket.version = (ticket.version || 0) + 1;
  return ticket;
}
