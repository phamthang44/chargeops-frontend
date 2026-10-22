# Isolated responsive UI fixtures

Run `npx expo start --web --port 8083 --offline` from this directory.

This separate Expo project renders production components with synthetic data. Production index.ts/App.tsx do not import it. Its Metro resolver substitutes bookingService ONLY for PaymentProcessingScreen and QRCheckInScreen, and expo-camera ONLY for QRCheckInScreen. The fixture service has no API client or network calls. Payment actions operate in memory; check-in confirmation throws locally to prevent a command. This verifies rendering and control reachability, not payment/cancellation/check-in business correctness.

QR controls use a synthetic camera surface and a Scan fixture QR button. They never open camera hardware or request browser permissions. Do not press Open Settings during visual QA: that production action still opens system settings. The button scene checks long labels and disabled/loading states. Run `node --test test-isolation.cjs` to check resolver isolation.

Do not copy this resolver into production configuration. The toolbar consumes extra vertical space, making the same target viewport stricter than the normal app. Avatar initials do not verify image loading, crop, upload or native permissions. Local preferences belong to the fixture origin on port 8083.
