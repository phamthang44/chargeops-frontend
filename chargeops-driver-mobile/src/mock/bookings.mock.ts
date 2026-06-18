import type { Booking } from '@/types';

/** Mock bookings covering a spread of statuses. */
export const bookingsMock: Booking[] = [
  { id: 'bk-001', slotId: 'sl-1002', status: 'CONFIRMED' },
  { id: 'bk-002', slotId: 'sl-2002', status: 'CHECKED_IN', checkedInAt: '2026-06-18T09:02:00+07:00' },
  { id: 'bk-003', slotId: 'sl-3001', status: 'COMPLETED', checkedInAt: '2026-06-17T08:05:00+07:00' },
  { id: 'bk-004', slotId: 'sl-1003', status: 'PENDING' },
  { id: 'bk-005', slotId: 'sl-2001', status: 'CANCELLED' },
  { id: 'bk-006', slotId: 'sl-1001', status: 'NO_SHOW' },
];
