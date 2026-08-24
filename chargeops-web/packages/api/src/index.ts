import { resolveConfig, type ApiConfig } from './config';
import { HttpClient } from './http';
import { createMockServices } from './mock/services';
import { createRestServices } from './rest/services';
import type { Services } from './services';

export * from './types';
export * from './format';
export * from './status';
export * from './services';
export * from './domainPolicies';
export * from './react';
export { ApiError, HttpClient } from './http';
export { resolveConfig, type ApiConfig } from './config';
export { createMockServices } from './mock/services';
export { createRestServices } from './rest/services';

export interface CreateServicesOptions extends Partial<ApiConfig> {
  /** Owner console (scoped data) vs admin console (platform-wide). Mock-mode only. */
  ownerView?: boolean;
}

/**
 * Entry point apps use. Reads VITE_API_URL / VITE_USE_MOCKS:
 *   mocks (default)  → deterministic in-memory data with simulated latency
 *   VITE_USE_MOCKS=false → real REST API via HttpClient (+ bearer token)
 */
export function createServices(options: CreateServicesOptions = {}): Services {
  const cfg = resolveConfig(options);
  if (cfg.useMocks) return createMockServices({ ownerView: options.ownerView ?? true });
  return createRestServices(new HttpClient(cfg));
}
