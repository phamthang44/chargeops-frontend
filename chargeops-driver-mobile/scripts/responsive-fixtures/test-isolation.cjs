const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const config = require('./metro.config');

test('only the payment screen booking-service dependency is substituted', () => {
  const app = path.resolve(__dirname, '../..');
  const fallback = { type: 'sourceFile', filePath: 'normal-resolution' };
  const context = { originModulePath: path.join(app, 'src/screens/PaymentProcessingScreen.tsx'), resolveRequest: () => fallback };
  const result = config.resolver.resolveRequest(context, '../../src/services/bookingService', 'web');
  assert.equal(result.filePath, path.join(__dirname, 'bookingService.fixture.js'));
  assert.equal(config.resolver.resolveRequest(context, '../../src/services/stationService', 'web'), fallback);
  assert.equal(config.resolver.resolveRequest({ ...context, originModulePath: path.join(app, 'src/screens/BookingConfirmationScreen.tsx') }, '../../src/services/bookingService', 'web'), fallback);
});

test('fixture service supplies deterministic failures without API clients', async () => {
  const fixture = await import('./bookingService.fixture.js');
  for (const outcome of ['FAILED', 'TIMEOUT', 'CANCELLED']) {
    fixture.setOutcome(outcome);
    assert.equal((await fixture.confirmPayment('ui-fixture')).status, outcome);
  }
  assert.equal((await fixture.cancelBooking('ui-fixture')).id, 'ui-fixture');
  assert.equal((await fixture.getBookingById('ui-fixture')).code, 'UI-ONLY-2026');
});


test('QR fixture replaces only its own camera and booking dependencies', () => {
  const app = path.resolve(__dirname, '../..');
  const fallback = { type: 'sourceFile', filePath: 'normal-resolution' };
  const context = { originModulePath: path.join(app, 'src/screens/QRCheckInScreen.tsx'), resolveRequest: () => fallback };
  assert.equal(config.resolver.resolveRequest(context, 'expo-camera', 'web').filePath, path.join(__dirname, 'camera.fixture.jsx'));
  assert.equal(config.resolver.resolveRequest(context, '../../src/services/bookingService', 'web').filePath, path.join(__dirname, 'bookingService.fixture.js'));
  assert.equal(config.resolver.resolveRequest({ ...context, originModulePath: path.join(app, 'src/components/CameraPortraitModal.tsx') }, 'expo-camera', 'web'), fallback);
});
