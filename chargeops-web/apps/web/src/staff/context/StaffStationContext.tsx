import type { ReactNode } from 'react';
import { OwnerStationProvider, useOwnerStation } from '../../owner/context/OwnerStationContext';

/**
 * The staff console is bound to exactly one station: the ACTIVE assignment
 * returned by `GET /me/staff/current-context`. `OwnerStationProvider` in
 * `reduced` mode already resolves that single station from the staff context
 * (and no longer queries the owner station list), so the staff shell reuses it
 * rather than growing a second, divergent copy of the same logic.
 *
 * `setSelectedStationId` is a no-op in reduced mode — the header never renders
 * a station picker for staff (Ops-05).
 */
export function StaffStationProvider({ children }: { children: ReactNode }) {
  return <OwnerStationProvider reduced>{children}</OwnerStationProvider>;
}

export function useStaffStation() {
  return useOwnerStation();
}
