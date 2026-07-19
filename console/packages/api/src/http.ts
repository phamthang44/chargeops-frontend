import type { ApiConfig } from './config';

/** Normalized API failure — one error shape for the whole UI regardless of transport. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Any plain object of primitives — undefined/empty values are skipped. */
type Query = object;

interface RequestOptions {
  params?: Query;
  body?: unknown;
}

const TIMEOUT_MS = 15_000;

/**
 * Thin fetch wrapper the REST services are built on:
 * base URL + query building, JSON in/out, bearer-token injection, timeout,
 * and error normalization (expects Spring-style problem JSON on failures).
 */
export class HttpClient {
  constructor(private readonly cfg: ApiConfig) {}

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.cfg.baseUrl + path, window.location.origin);
    for (const [k, v] of Object.entries(opts.params ?? {}) as [string, unknown][]) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const token = await this.cfg.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === 'TimeoutError';
      throw new ApiError(0, timedOut ? 'TIMEOUT' : 'NETWORK', timedOut ? 'Yêu cầu quá thời gian chờ.' : 'Không thể kết nối máy chủ.');
    }

    if (!res.ok) {
      let code = 'HTTP_' + res.status;
      let message = `Lỗi máy chủ (${res.status}).`;
      let details: unknown;
      try {
        const problem = (await res.json()) as { code?: string; message?: string; detail?: string };
        code = problem.code ?? code;
        message = problem.message ?? problem.detail ?? message;
        details = problem;
      } catch {
        /* non-JSON error body — keep defaults */
      }
      throw new ApiError(res.status, code, message, details);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string, params?: Query): Promise<T> {
    return this.request<T>('GET', path, { params });
  }
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }
  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
