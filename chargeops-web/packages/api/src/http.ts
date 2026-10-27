import type { ApiConfig } from './config';
import { retryDeadline, courtesyIdentity } from './rateLimit';

/** Normalized API failure — one error shape for the whole UI regardless of transport. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly messageKey?: string,
    public readonly details?: unknown,
    public readonly traceId?: string,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Any plain object of primitives — undefined/empty values are skipped. */
type Query = object;

export interface DownloadFile {
  blob: Blob;
  filename: string;
}

interface RequestOptions {
  params?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  responseType?: 'json' | 'download';
}

const TIMEOUT_MS = 15_000;

/**
 * Thin fetch wrapper the REST services are built on:
 * base URL + query building, JSON in/out, bearer-token injection, timeout,
 * and error normalization (expects Spring-style problem JSON on failures).
 */
export class HttpClient {
  private readonly cooldowns = new Map<string, { until: number; error: ApiError }>();
  constructor(private readonly cfg: ApiConfig) {}

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.cfg.baseUrl + path, window.location.origin);
    let cooldownKey = '';
    for (const [k, v] of Object.entries(opts.params ?? {}) as [string, unknown][]) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = { Accept: 'application/json', ...(opts.headers ?? {}) };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const language = this.cfg.getLanguage?.();
    if (language) headers['Accept-Language'] = language;
    let res: Response;
    try {
      const token = await this.cfg.getToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
      cooldownKey = `${courtesyIdentity(headers.Authorization ?? headers.authorization)}:${method}:${url.pathname}`;
      const cooling = this.cooldowns.get(cooldownKey);
      if (cooling && cooling.until > Date.now()) throw cooling.error;
      this.cooldowns.delete(cooldownKey);
      res = await fetch(url, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
      });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
      const authFailure = e instanceof Error && /keycloak|token|auth/i.test(e.message);
      throw new ApiError(0, timedOut ? 'TIMEOUT' : authFailure ? 'AUTH_PROVIDER_UNAVAILABLE' : 'NETWORK', e instanceof Error ? e.message : String(e));
    }

    if (!res.ok) {
      let code = 'HTTP_' + res.status;
      let message = `Lỗi máy chủ (${res.status}).`;
      let messageKey: string | undefined;
      let details: unknown;
      let traceId: string | undefined;
      try {
        const raw = await res.text();
        const problem = (raw ? JSON.parse(raw) : null) as {
          error?: { code?: string; messageKey?: string; message?: string; details?: unknown; traceId?: string };
          code?: string;
          message?: string;
          detail?: string;
          traceId?: string;
          requestId?: string;
        };
        if (problem?.error) {
          code = problem.error.code ?? code;
          message = problem.error.message ?? message;
          messageKey = problem.error.messageKey;
          details = problem.error.details;
          traceId = problem.error.traceId ?? problem.traceId ?? problem.requestId;
        } else if (problem) {
          code = problem.code ?? code;
          message = problem.message ?? problem.detail ?? message;
          details = problem;
          traceId = problem.traceId ?? problem.requestId;
        }
      } catch {
        /* non-JSON error body — keep defaults */
      }
      traceId ??= res.headers.get('X-Trace-Id') ?? res.headers.get('X-Request-Id') ?? undefined;
      const error = new ApiError(res.status, code, message, messageKey, details, traceId, res.headers.get('Retry-After') ?? undefined);
      const until = retryDeadline(error);
      if (until > Date.now()) {
        if (this.cooldowns.size >= 200) this.cooldowns.delete(this.cooldowns.keys().next().value!);
        this.cooldowns.set(cooldownKey, { until, error });
      }
      throw error;
    }

    if (opts.responseType === 'download') {
      if (res.headers.get('Content-Type')?.includes('json')) {
        throw new ApiError(res.status, 'INVALID_FILE', 'The server did not return a file.');
      }
      let blob: Blob;
      try {
        blob = await res.blob();
      } catch (e) {
        const timedOut = e instanceof DOMException && e.name === 'TimeoutError';
        throw new ApiError(0, timedOut ? 'TIMEOUT' : 'NETWORK', timedOut ? 'Yêu cầu quá thời gian chờ.' : 'Không thể kết nối máy chủ.');
      }
      return { blob, filename: downloadFilename(res.headers.get('Content-Disposition')) } as T;
    }
    if (res.status === 204) return undefined as T;
    let body: {
      data?: T;
      meta?: { page?: number; size?: number; totalElements?: number; totalPages?: number };
      error?: unknown;
    };
    try {
      body = (await res.json()) as typeof body;
    } catch (e) {
      const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
      throw new ApiError(res.status, timedOut ? 'TIMEOUT' : 'INVALID_RESPONSE', e instanceof Error ? e.message : String(e), undefined, undefined, res.headers.get('X-Trace-Id') ?? undefined);
    }
    if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
      if (
        Array.isArray(body.data) &&
        body.meta &&
        typeof body.meta === 'object' &&
        ('totalElements' in body.meta || 'totalPages' in body.meta || 'page' in body.meta)
      ) {
        return {
          items: body.data,
          total: Number(body.meta.totalElements ?? body.data.length),
          page: Number(body.meta.page ?? 1),
          pageSize: Number(body.meta.size ?? body.data.length),
          meta: body.meta,
          counts: (body.meta as any).counts ?? {},
        } as unknown as T;
      }
      return body.data as T;
    }
    return body as unknown as T;
  }

  get<T>(path: string, params?: Query, opts?: Omit<RequestOptions, 'params' | 'body'>): Promise<T> {
    return this.request<T>('GET', path, { params, ...opts });
  }

  download(path: string, params?: Query): Promise<DownloadFile> {
    return this.request<DownloadFile>('GET', path, {
      params,
      responseType: 'download',
      timeoutMs: 60_000,
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json' },
    });
  }
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('POST', path, { body, ...opts });
  }
  put<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PUT', path, { body, ...opts });
  }
  patch<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PATCH', path, { body, ...opts });
  }
  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }
}

function downloadFilename(disposition: string | null): string {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let name = disposition?.match(/filename="([^"]+)"|filename=([^;]+)/i)?.slice(1).find(Boolean);
  if (encoded) {
    try { name = decodeURIComponent(encoded); } catch { /* use the ordinary filename */ }
  }
  return name?.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'chargeops-bookings.xlsx';
}
