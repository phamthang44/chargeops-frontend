import type {
  CreateTicketPayload,
  Ticket,
  TicketListParams,
  TicketListResult,
  TicketMessage,
} from '@/types';
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

/** Tạo UUIDv4 chuẩn phía client để làm Idempotency-Key */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    throw new Error(errJson?.error?.message || errJson?.message || `Lỗi tạo phiếu: ${res.status}`);
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

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets?${query.toString()}`, { headers });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data ?? [];
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
    throw new Error(errJson?.error?.message || errJson?.message || `Lỗi tải danh sách phiếu: ${res.status}`);
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

    const res = await fetch(`${apiBaseUrl}/api/v1/tickets/${ticketId}`, { headers });
    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error?.message || errJson?.message || 'Không tìm thấy phiếu');
  }

  // Mock implementation (chỉ chạy khi EXPO_PUBLIC_USE_MOCKS='true')
  const found = mockTickets.find((t) => t.ticketId === ticketId);
  if (!found) {
    throw new Error('Phiếu hỗ trợ không tồn tại');
  }
  return found;
}

/**
 * Phản hồi thêm tin nhắn vào phiếu (POST /api/v1/tickets/:ticketId/messages)
 * Kèm Idempotency-Key và Silent Safe Replay
 */
export async function replyTicket(
  ticketId: string,
  body: string,
  clientMessageId?: string,
  accessToken?: string | null
): Promise<TicketMessage> {
  const effectiveKey = clientMessageId || generateUUID();

  if (!isMockMode()) {
    const token = resolveAccessToken(accessToken);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Idempotency-Key': effectiveKey,
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
      return json?.data ?? json;
    }
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error?.message || errJson?.message || 'Không thể gửi phản hồi');
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
