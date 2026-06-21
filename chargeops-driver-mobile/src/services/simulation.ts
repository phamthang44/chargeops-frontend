/**
 * Demo simulation control (mock-only).
 *
 * Lets a demo deterministically force the outcome of payment + booking-creation
 * so every status / edge case can be shown on demand. The booking/payment
 * services read this config at call time; a dev panel (SettingsModal) writes it.
 *
 * This file is part of the MOCK layer ONLY — when the real REST API lands, the
 * services stop reading it and these outcomes come from the backend instead.
 */

/** What `confirmPayment` should resolve to. RANDOM picks a weighted outcome. */
export type PaymentSimOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMEOUT' | 'RANDOM';
/** Concrete payment results (RANDOM resolved away). */
export type PaymentResultStatus = Exclude<PaymentSimOutcome, 'RANDOM'>;

/** What `createBooking` should do. RANDOM picks a weighted outcome. */
export type BookingSimOutcome = 'SUCCESS' | 'SLOT_TAKEN' | 'NETWORK_ERROR' | 'RANDOM';
/** Concrete booking-creation results (RANDOM resolved away). */
export type BookingResultStatus = Exclude<BookingSimOutcome, 'RANDOM'>;

export interface SimConfig {
  payment: PaymentSimOutcome;
  booking: BookingSimOutcome;
}

// Default to the happy path so the normal demo just works.
const config: SimConfig = { payment: 'SUCCESS', booking: 'SUCCESS' };

export function getSimConfig(): SimConfig {
  return { ...config };
}

export function setPaymentSim(outcome: PaymentSimOutcome): void {
  config.payment = outcome;
}

export function setBookingSim(outcome: BookingSimOutcome): void {
  config.booking = outcome;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Weighted pools for RANDOM (mostly succeed, but exercise every edge case).
const PAYMENT_POOL: readonly PaymentResultStatus[] = [
  'SUCCESS',
  'SUCCESS',
  'SUCCESS',
  'FAILED',
  'CANCELLED',
  'TIMEOUT',
];
const BOOKING_POOL: readonly BookingResultStatus[] = [
  'SUCCESS',
  'SUCCESS',
  'SUCCESS',
  'SLOT_TAKEN',
  'NETWORK_ERROR',
];

/** Resolve the configured payment outcome (RANDOM -> a concrete status). */
export function resolvePaymentOutcome(): PaymentResultStatus {
  return config.payment === 'RANDOM' ? pick(PAYMENT_POOL) : config.payment;
}

/** Resolve the configured booking-creation outcome (RANDOM -> concrete). */
export function resolveBookingOutcome(): BookingResultStatus {
  return config.booking === 'RANDOM' ? pick(BOOKING_POOL) : config.booking;
}
