import type { AdminBookingDossier, AdminRefundPolicyContext, ServiceFailureDecisionSummary, ServiceFailureRefundSummary, StationFailureEligibility, ApiBookingStatus } from '../types';

/** Backend context is case-scoped and contains a nested booking dossier. */
export interface RefundPolicyContextWire {
  ticketId: string;
  escalationId: string;
  ticketVersion: number;
  active: boolean;
  bookingCode?: string;
  packageAmountVnd?: number;
  grant: StationFailureEligibility;
  insufficient: StationFailureEligibility;
  dossier?: AdminBookingDossier | null;
  booking: {
    bookingId: string;
    bookingVersion: number;
    decisionVersion: number;
    status: ApiBookingStatus;
    evaluatedAt: string;
    eligibleAmount: number | null;
    serviceFailureDecisions: ServiceFailureDecisionSummary[];
    refund: ServiceFailureRefundSummary | null;
  };
}

function normalizeDossier(dossier?: AdminBookingDossier | null): AdminBookingDossier | null {
  if (!dossier || typeof dossier !== 'object') return null;
  return {
    ...dossier,
    window: dossier.window ?? { durationMin: 0 },
    snapshot: dossier.snapshot ?? {},
    policy: dossier.policy ?? {},
    timeline: dossier.timeline ?? {},
    priceLines: Array.isArray(dossier.priceLines) ? dossier.priceLines : [],
  };
}

export function normalizeRefundPolicyContext(raw: RefundPolicyContextWire): AdminRefundPolicyContext {
  const booking = raw.booking;
  if (!booking || !raw.ticketId || !raw.escalationId
      || !Number.isInteger(raw.ticketVersion) || !Number.isInteger(booking.bookingVersion)
      || !Number.isInteger(booking.decisionVersion)) {
    throw new Error('Invalid refund policy context');
  }
  const history = booking.serviceFailureDecisions ?? [];
  return {
    ticketId: raw.ticketId,
    escalationId: raw.escalationId,
    ticketVersion: raw.ticketVersion,
    active: raw.active === true,
    bookingId: booking.bookingId,
    bookingCode: raw.bookingCode,
    packageAmountVnd: raw.packageAmountVnd ?? null,
    bookingVersion: booking.bookingVersion,
    decisionVersion: booking.decisionVersion,
    bookingStatus: booking.status,
    evaluatedAt: booking.evaluatedAt,
    eligibleRefundAmountVnd: booking.eligibleAmount ?? null,
    grantEligibility: raw.grant,
    insufficientEligibility: raw.insufficient,
    reviewEligibility: {
      allowed: raw.active === true && (raw.grant?.allowed === true || raw.insufficient?.allowed === true),
      reason: raw.active ? raw.grant?.reason : 'ESCALATION_NOT_ACTIVE',
    },
    latestDecision: history.reduce<ServiceFailureDecisionSummary | null>(
      (latest, decision) => !latest || decision.sequenceNo > latest.sequenceNo ? decision : latest, null),
    refundSummary: booking.refund,
    historyDecisions: history,
    dossier: normalizeDossier(raw.dossier),
  };
}
