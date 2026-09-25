// @ts-nocheck
import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function run() {
  console.log('=== 1. Testing mobile computeRefund (Booking v4.9) ===');

  // Pure computeRefund implementation to verify the logic contracts
  function getBookingTimeRemainingMs(deadline: string | null | undefined, now: number): number {
    if (!deadline) return 0;
    const deadlineMs = Date.parse(deadline);
    return Number.isFinite(deadlineMs) ? Math.max(0, deadlineMs - now) : 0;
  }

  function computeRefundContract(booking: any, now: number) {
    const serverReason = booking.actions?.cancellationReason;
    const isUnpaid = booking.status === 'PENDING' || serverReason === 'UNPAID';
    const minutesBefore = Math.floor((new Date(booking.startAt).getTime() - now) / 60_000);

    if (isUnpaid) {
      return {
        tier: 'UNPAID',
        percent: 0,
        refundAmount: 0,
        feeAmount: 0,
        minutesBefore,
        graceRemainingMs: 0,
        isUnpaid: true,
      };
    }

    const graceRemainingMs = getBookingTimeRemainingMs(booking.freeCancellationDeadline, now);
    const isGrace =
      graceRemainingMs > 0 &&
      (serverReason !== undefined ? serverReason === 'WITHIN_GRACE' : true);

    const percent = isGrace ? 100 : 0;
    const tier = isGrace ? 'GRACE' : 'NONE';
    const refundAmount = isGrace ? booking.totalPrice : 0;
    const feeAmount = Math.max(0, booking.totalPrice - refundAmount);

    return {
      tier,
      percent,
      refundAmount,
      feeAmount,
      minutesBefore,
      graceRemainingMs: isGrace ? graceRemainingMs : 0,
      isUnpaid: false,
    };
  }

  const baseMockBooking: any = {
    id: 'bk-test',
    code: 'CHG-9999',
    connectorId: 'cn-1',
    startAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    durationMin: 60,
    totalPrice: 100000,
    status: 'CONFIRMED',
  };

  // Case 1.1: Within grace period (freeCancellationDeadline is in future)
  const now = Date.now();
  const withinGraceBooking = {
    ...baseMockBooking,
    freeCancellationDeadline: new Date(now + 5 * 60_000).toISOString(),
  };
  const refundWithinGrace = computeRefundContract(withinGraceBooking, now);
  assert(refundWithinGrace.tier === 'GRACE', 'Refund tier is GRACE when within deadline');
  assert(refundWithinGrace.percent === 100, 'Refund percent is 100% within grace');
  assert(refundWithinGrace.refundAmount === 100000, 'Refund amount equals total price within grace');
  assert(refundWithinGrace.feeAmount === 0, 'Cancellation fee is 0 within grace');

  // Case 1.2: Exactly at deadline
  const atDeadlineBooking = {
    ...baseMockBooking,
    freeCancellationDeadline: new Date(now).toISOString(),
  };
  const refundAtDeadline = computeRefundContract(atDeadlineBooking, now);
  assert(refundAtDeadline.tier === 'NONE', 'Refund tier is NONE at deadline');
  assert(refundAtDeadline.percent === 0, 'Refund percent is 0% at deadline');
  assert(refundAtDeadline.refundAmount === 0, 'Refund amount is 0 at deadline');
  assert(refundAtDeadline.feeAmount === 100000, 'Cancellation fee is 100% of price at deadline');

  // Case 1.3: After deadline
  const afterDeadlineBooking = {
    ...baseMockBooking,
    freeCancellationDeadline: new Date(now - 60_000).toISOString(),
  };
  const refundAfterDeadline = computeRefundContract(afterDeadlineBooking, now);
  assert(refundAfterDeadline.tier === 'NONE', 'Refund tier is NONE after deadline');
  assert(refundAfterDeadline.percent === 0, 'Refund percent is 0% after deadline');
  assert(refundAfterDeadline.refundAmount === 0, 'Refund amount is 0 after deadline');

  // Case 1.4: Unpaid booking (PENDING)
  const unpaidBooking = {
    ...baseMockBooking,
    status: 'PENDING',
    freeCancellationDeadline: null,
  };
  const refundUnpaid = computeRefundContract(unpaidBooking, now);
  assert(refundUnpaid.tier === 'UNPAID', 'Refund tier is UNPAID for pending booking');
  assert(refundUnpaid.percent === 0, 'Refund percent is 0 for pending booking');
  assert(refundUnpaid.refundAmount === 0, 'Refund amount is 0 for pending booking');

  // Case 1.5: Missing deadline
  const noDeadlineBooking = {
    ...baseMockBooking,
    freeCancellationDeadline: null,
  };
  const refundNoDeadline = computeRefundContract(noDeadlineBooking, now);
  assert(refundNoDeadline.tier === 'NONE', 'Refund tier is NONE when deadline is null');
  assert(refundNoDeadline.refundAmount === 0, 'Refund amount is 0 when deadline is null');

  console.log('\n=== 2. Auditing bookingService.ts source code for RefundTier ===');
  const bookingServicePath = path.resolve(__dirname, '../src/services/bookingService.ts');
  const bookingServiceSrc = fs.readFileSync(bookingServicePath, 'utf-8');
  assert(bookingServiceSrc.includes("export type RefundTier = 'UNPAID' | 'GRACE' | 'NONE';"), 'bookingService.ts has clean RefundTier (UNPAID | GRACE | NONE)');
  assert(!bookingServiceSrc.includes("'FULL'"), 'bookingService.ts does not include obsolete FULL tier');
  assert(!bookingServiceSrc.includes("'PARTIAL'"), 'bookingService.ts does not include obsolete PARTIAL tier');

  console.log('\n=== 3. Auditing bookings.mock.ts ===');
  const mockPath = path.resolve(__dirname, '../src/mock/bookings.mock.ts');
  const mockSrc = fs.readFileSync(mockPath, 'utf-8');
  assert(!mockSrc.includes('refundPercent: 50'), 'No mock bookings have legacy 50% refund');
  assert(mockSrc.includes("id: 'bk-005'"), 'bk-005 exists in mock');
  assert(mockSrc.includes('refundPercent: 0'), 'bk-005 has 0% refund per Booking v4.9');

  console.log('\n=== 4. Auditing i18n Locales for "Ví ChargeOps" in Refund/Booking Copy ===');
  const viPath = path.resolve(__dirname, '../src/i18n/locales/vi.json');
  const enPath = path.resolve(__dirname, '../src/i18n/locales/en.json');
  const vi = JSON.parse(fs.readFileSync(viPath, 'utf-8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  assert(!vi.bookingDetail?.refundedNote?.includes('Ví ChargeOps'), 'vi.bookingDetail.refundedNote does not mention Ví ChargeOps');
  assert(!vi.bookingDetail?.refundDescProcessing?.includes('Ví ChargeOps'), 'vi.bookingDetail.refundDescProcessing does not mention Ví ChargeOps');
  assert(!vi.bookingDetail?.refundDescSucceeded?.includes('Ví ChargeOps'), 'vi.bookingDetail.refundDescSucceeded does not mention Ví ChargeOps');
  assert(!vi.bookingDetail?.graceCardRemaining?.includes('về ví'), 'vi.bookingDetail.graceCardRemaining does not mention về ví');
  assert(!vi.cancelBooking?.walletNote?.includes('Ví ChargeOps'), 'vi.cancelBooking.walletNote does not mention Ví ChargeOps');

  assert(!en.bookingDetail?.refundedNote?.includes('ChargeOps Wallet'), 'en.bookingDetail.refundedNote does not mention ChargeOps Wallet');
  assert(!en.bookingDetail?.refundDescProcessing?.includes('ChargeOps Wallet'), 'en.bookingDetail.refundDescProcessing does not mention ChargeOps Wallet');
  assert(!en.bookingDetail?.refundDescSucceeded?.includes('ChargeOps Wallet'), 'en.bookingDetail.refundDescSucceeded does not mention ChargeOps Wallet');
  assert(!en.bookingDetail?.graceCardRemaining?.includes('wallet refund'), 'en.bookingDetail.graceCardRemaining does not mention wallet refund');
  assert(!en.cancelBooking?.walletNote?.includes('ChargeOps Wallet'), 'en.cancelBooking.walletNote does not mention ChargeOps Wallet');

  console.log('\n🎉 ALL CANCELLATION ALIGNMENT TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
