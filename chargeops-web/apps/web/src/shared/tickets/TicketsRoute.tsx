import { Route, Routes } from 'react-router-dom';
import { TicketsPage } from './TicketsPage';
import { TicketDetail } from './TicketDetail';

/**
 * Nested under `/owner/tickets/*`, `/staff/tickets/*`, or `/admin/tickets/*`.
 * Same components for every console — `admin` toggles reassign/escalate and
 * drops the single-station framing. Scoping itself (which tickets are visible
 * at all) is server-side per the signed-in token, not a prop here.
 */
export function TicketsRoute({ admin = false }: { admin?: boolean }) {
  return (
    <Routes>
      <Route index element={<TicketsPage admin={admin} />} />
      <Route path=":id" element={<TicketDetail admin={admin} />} />
    </Routes>
  );
}
