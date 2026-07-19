import { createContext, useContext, type ReactNode } from 'react';
import type { Services } from './services';

const ApiContext = createContext<Services | null>(null);

export function ApiProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ApiContext.Provider value={services}>{children}</ApiContext.Provider>;
}

/** Access the app's data services (mock or REST — callers can't tell). */
export function useApi(): Services {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used inside <ApiProvider>');
  return ctx;
}
