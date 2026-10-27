/** Client-side courtesy guard. Server-side Redis remains authoritative. Never replays mutations. */
const cooldowns = new Map<string, { until: number; body: string; status: number; headers: Headers }>();
function courtesyIdentity(authorization: string): string {
  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.sub === 'string' && payload.sub) return JSON.stringify([payload.iss, payload.sub]);
  } catch { /* fallback partitions opaque credentials; never used for server authorization */ }
  return authorization || 'anonymous';
}
export function securityRetryDetails(response: Response, details: unknown): Record<string, unknown> {
  const header = response.headers.get('Retry-After');
  const parsed = header && /^\d+$/.test(header.trim()) ? Number(header) : header ? Math.ceil((Date.parse(header) - Date.now()) / 1000) : NaN;
  const original = details && typeof details === 'object' ? details as Record<string, unknown> : {};
  const seconds = Number.isFinite(parsed) ? parsed : Number(original.retryAfterSeconds);
  return { ...original, retryAfterSeconds: Math.min(86400, Math.max(1, Number.isFinite(seconds) ? seconds : 5)) };
}
export async function securityFetch(input: string, init: RequestInit): Promise<Response> {
  const key = `${courtesyIdentity(new Headers(init.headers).get('Authorization') ?? '')}:${init.method ?? 'GET'}:${input.split('?')[0]}`;
  const cached = cooldowns.get(key);
  if (cached && cached.until > Date.now()) {
    const seconds = Math.max(1, Math.ceil((cached.until - Date.now()) / 1000));
    const headers = new Headers(cached.headers); headers.set('Retry-After', String(seconds));
    return new Response(cached.body, { status: cached.status, headers });
  }
  cooldowns.delete(key);
  const response = await fetch(input, init);
  if (response.status === 429 || response.status === 503) {
    const body = await response.clone().text();
    let error: { code?: string; details?: unknown } | undefined;
    try { error = JSON.parse(body)?.error; } catch { /* preserve transport failure */ }
    if (response.status === 429 || error?.code === 'SEC_003') {
      const details = securityRetryDetails(response, error?.details);
      if (cooldowns.size >= 100) cooldowns.delete(cooldowns.keys().next().value!);
      cooldowns.set(key, { until: Date.now() + Number(details.retryAfterSeconds) * 1000, body, status: response.status, headers: response.headers });
    }
  }
  return response;
}
