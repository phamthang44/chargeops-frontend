/** Stable deadlines: rerendering an error must never restart its cooldown. */
const deadlines = new WeakMap<object, number>();
/** Courtesy-cache identity only; server signature validation remains authoritative. */
export function courtesyIdentity(authorization = ''): string {
  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.sub === 'string' && payload.sub) return JSON.stringify([payload.iss, payload.sub]);
  } catch { /* opaque/non-JWT supplier: partition by its opaque value */ }
  return authorization || 'anonymous';
}
export function retryDeadline(error: unknown): number {
  if (!error || typeof error !== 'object') return 0;
  const cached = deadlines.get(error);
  if (cached !== undefined) return cached;
  const e = error as { status?: number; code?: string; retryAfter?: string; details?: { retryAfterSeconds?: number } };
  if (e.status !== 429 && !['SEC_001', 'SEC_002', 'SEC_003'].includes(e.code ?? '')) return 0;
  const now = Date.now();
  const header = e.retryAfter?.trim();
  const seconds = header && /^\d+$/.test(header) ? Number(header) : e.details?.retryAfterSeconds;
  const deadline = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
    ? now + Math.min(seconds, 86_400) * 1000
    : header && Number.isFinite(Date.parse(header)) ? Math.min(Date.parse(header), now + 86_400_000) : now + 5000;
  deadlines.set(error, deadline);
  return deadline;
}
export function shouldRetryApiError(failureCount: number, error: unknown): boolean {
  const e = error as { status?: number; code?: string } | null;
  return e?.status !== 429 && !['SEC_001', 'SEC_002', 'SEC_003'].includes(e?.code ?? '') && failureCount < 1;
}
