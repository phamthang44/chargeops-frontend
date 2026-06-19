import type { TFunction } from 'i18next';

/** Auth error codes thrown by authService (see AuthErrorCode there). */
const AUTH_ERROR_CODES = ['EMAIL_EXISTS', 'INVALID_OTP', 'INVALID_CREDENTIALS', 'GENERIC'] as const;

/**
 * Map an error thrown by the auth service (whose message is a stable CODE) to a
 * localized message via the `auth.errors.<CODE>` keys. Unknown errors fall back to GENERIC.
 */
export function authErrorMessage(t: TFunction, error: unknown): string {
  const code =
    error instanceof Error && (AUTH_ERROR_CODES as readonly string[]).includes(error.message)
      ? error.message
      : 'GENERIC';
  return t(`auth.errors.${code}`);
}
