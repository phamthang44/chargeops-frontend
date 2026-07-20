export interface ApiConfig {
  /** Base URL of the ChargeOps REST API, e.g. "http://localhost:8080/api/v1". */
  baseUrl: string;
  /** true → in-memory mock services (default until the backend exists). */
  useMocks: boolean;
  /**
   * Access-token supplier injected into every request (Authorization: Bearer).
   * Real mode: () => keycloak.token from @chargeops/auth.
   */
  getToken?: () => string | null | Promise<string | null>;
}

/**
 * Resolve config from Vite env with safe defaults.
 *   VITE_API_URL   — backend base URL      (default /api/v1, same-origin proxy)
 *   VITE_USE_MOCKS — "false" to hit the real API (default "true")
 */
export function resolveConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  return {
    baseUrl: overrides.baseUrl ?? env.VITE_API_URL ?? '/api/v1',
    useMocks: overrides.useMocks ?? env.VITE_USE_MOCKS !== 'false',
    getToken: overrides.getToken,
  };
}
