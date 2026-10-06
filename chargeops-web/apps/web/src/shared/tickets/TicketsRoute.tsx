import { Route, Routes } from 'react-router-dom';
import { TicketsPage } from './TicketsPage';
import { TicketDetail } from './TicketDetail';
import type { TicketRoleOption } from './hooks/useTicketDetail';

/**
 * Nested under `/owner/tickets/*`, `/staff/tickets/*`, or `/admin/tickets/*`.
 * Same components for every console — `role` selects the scoping endpoint
 * (owner/admin/staff) and `admin` toggles reassign/escalate. Station staff
 * claim tickets themselves and never get the manual assignment UI (Ops-06).
 * Scoping itself (which tickets are visible at all) is server-side per the
 * signed-in token, not a prop here.
 */
export function TicketsRoute({
  admin = false,
  role,
}: {
  admin?: boolean;
  role?: TicketRoleOption;
}) {
  const apiRole: TicketRoleOption = role ?? (admin ? 'admin' : 'owner');
  return (
    <Routes>
      <Route index element={<TicketsPage admin={admin} role={apiRole} />} />
      <Route path=":id" element={<TicketDetail admin={admin} role={apiRole} />} />
    </Routes>
  );
}
