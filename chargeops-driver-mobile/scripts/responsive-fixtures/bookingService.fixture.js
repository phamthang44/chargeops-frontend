// Used only by this separate Expo project's resolver. No network imports.
export const booking = { id: 'ui-fixture', chargePointCode: 'CP-FIXTURE-LONG-2026', connectorCode: 'PORT-02', connectorType: 'CCS2', powerKw: 120, code: 'UI-ONLY-2026', totalPrice: 1234567, paymentMethod: 'SIMULATOR', stationName: 'Trạm sạc kiểm thử giao diện — tên dài trên màn hình nhỏ', startAt: '2026-10-22T03:00:00Z', endAt: '2026-10-22T05:00:00Z' };
let outcome = 'FAILED';
export function setOutcome(value) { outcome = value; }
export async function getBookingById() { return booking; }
export async function confirmPayment() {
  if (outcome === 'processing') return new Promise(() => {});
  return { status: outcome, booking };
}
export async function cancelBooking() { return booking; }

export function getOutcome() { return outcome; }
export async function getActiveBookings() { return [booking]; }
export async function resolveCheckIn() {
  const connector = { id: 'CONNECTOR-FIXTURE-01', connectorType: 'CCS2', powerKw: 120 };
  if (outcome === 'qr-confirm') return { ok: true, booking, connector, challengeToken: 'ui-only', expectedVersion: 1, challengeExpiresAt: new Date(Date.now() + 300000).toISOString() };
  return { ok: false, code: 'WRONG_CONNECTOR', booking, connector };
}
export async function confirmCheckIn() { throw new Error('UI fixture blocks check-in command'); }
