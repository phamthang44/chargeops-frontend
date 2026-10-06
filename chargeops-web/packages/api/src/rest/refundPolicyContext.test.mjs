import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('./refundPolicyContext.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const { normalizeRefundPolicyContext } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const context = () => ({ ticketId: 'ticket', escalationId: 'escalation', ticketVersion: 4, active: true,
 bookingCode: 'BK-001', packageAmountVnd: 120000, grant: { allowed: false, reason: 'INELIGIBLE' }, insufficient: { allowed: true },
 booking: { bookingId: 'booking', bookingVersion: 8, decisionVersion: 2, status: 'COMPLETED', evaluatedAt: '2026-10-06T00:00:00Z', eligibleAmount: null,
 serviceFailureDecisions: [{ sequenceNo: 2 }, { sequenceNo: 1 }], refund: null } });
test('maps nested case context and preserves unavailable eligible amount', () => {
 const result = normalizeRefundPolicyContext(context());
 assert.equal(result.escalationId, 'escalation');
 assert.equal(result.bookingCode, 'BK-001');
 assert.equal(result.packageAmountVnd, 120000);
 assert.equal(result.eligibleRefundAmountVnd, null);
 assert.equal(result.bookingVersion, 8);
 assert.equal(result.latestDecision.sequenceNo, 2);
 assert.equal(result.reviewEligibility.allowed, true);
 assert.equal(result.grantEligibility.allowed, false);
});
test('inactive escalation cannot be reviewed', () => {
 const raw = context(); raw.active = false;
 assert.equal(normalizeRefundPolicyContext(raw).reviewEligibility.allowed, false);
});
test('missing concurrency version rejects context instead of guessing', () => {
 const raw = context(); delete raw.booking.bookingVersion;
 assert.throws(() => normalizeRefundPolicyContext(raw), /Invalid refund policy context/);
});
test('carries the booking dossier and defaults its empty collections', () => {
 const raw = context();
 raw.dossier = { currency: 'VND', window: { startAt: '2026-10-06T06:00:00', endAt: '2026-10-06T07:00:00', durationMin: 60 },
   timeline: { checkedInAt: '2026-10-06T06:02:00' }, priceLines: [{ label: '06:00–07:00', durationMin: 60, amount: 120000 }] };
 const result = normalizeRefundPolicyContext(raw);
 assert.equal(result.dossier.window.durationMin, 60);
 assert.equal(result.dossier.timeline.checkedInAt, '2026-10-06T06:02:00');
 assert.equal(result.dossier.priceLines.length, 1);
 assert.deepEqual(result.dossier.policy, {});
 assert.deepEqual(result.dossier.snapshot, {});
});
test('absent or malformed dossier normalizes to null', () => {
 assert.equal(normalizeRefundPolicyContext(context()).dossier, null);
 const raw = context(); raw.dossier = 'broken';
 assert.equal(normalizeRefundPolicyContext(raw).dossier, null);
});
