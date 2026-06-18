import { makeMockSession, usersMock } from '@/mock/users.mock';
import type { AuthSession, LoginRequest, RegisterRequest, User } from '@/types';

/**
 * Auth data layer.
 *
 * Same contract as the other services: the UI calls these async functions only.
 * NOW returns mock data; LATER swap each body for a real REST call without
 * changing signatures or any calling UI.
 *
 * NOTE: the role is fixed to DRIVER here — this is the driver app, and per
 * BR-ACC-01 a user has exactly one immutable role assigned at registration.
 */

function simulateNetwork<T>(data: T, delayMs = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

function rejectNetwork(message: string, delayMs = 350): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delayMs));
}

/** The mock OTP code accepted by verifyOtp. Real backend sends a random code. */
export const MOCK_OTP_CODE = '123456';

/** Channel an OTP is delivered through after registration. */
export type OtpChannel = 'phone' | 'email';

/**
 * Register a new driver account.
 * NOW: validate the email is unused (FR01), pretend to send an OTP, return where it went.
 * LATER: POST /auth/register
 */
export async function register(req: RegisterRequest): Promise<{ channel: OtpChannel; target: string }> {
  const exists = usersMock.some((u) => u.email.toLowerCase() === req.email.trim().toLowerCase());
  if (exists) {
    return rejectNetwork('Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.');
  }
  return simulateNetwork({ channel: 'phone', target: req.phone });
}

/**
 * Verify the OTP sent after registration and return an authenticated session.
 * NOW: accept MOCK_OTP_CODE, return a mock DRIVER session.
 * LATER: POST /auth/verify-otp
 */
export async function verifyOtp(target: string, code: string): Promise<AuthSession> {
  if (code !== MOCK_OTP_CODE) {
    return rejectNetwork('Mã xác minh không đúng. Vui lòng thử lại.');
  }
  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: 'Tài xế mới',
    email: 'new.driver@example.com',
    phone: target,
    role: 'DRIVER',
    status: 'ACTIVE',
  };
  return simulateNetwork(makeMockSession(newUser));
}

/**
 * Resend the OTP.
 * NOW: no-op. LATER: POST /auth/resend-otp
 */
export async function resendOtp(_target: string): Promise<void> {
  return simulateNetwork(undefined);
}

/**
 * Log in with email + password (FR01).
 * NOW: match against the mock users (password is not checked in mock).
 * LATER: POST /auth/login
 */
export async function login(req: LoginRequest): Promise<AuthSession> {
  const user = usersMock.find((u) => u.email.toLowerCase() === req.email.trim().toLowerCase());
  if (!user) {
    return rejectNetwork('Email hoặc mật khẩu không đúng.');
  }
  return simulateNetwork(makeMockSession(user));
}
