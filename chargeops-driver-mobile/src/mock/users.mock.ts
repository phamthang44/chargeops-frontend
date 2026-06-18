import type { AuthSession, User } from '@/types';

/** Mock driver accounts. Used by authService until a real API is wired in. */
export const usersMock: User[] = [
  {
    id: 'usr-001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '+84987654321',
    role: 'DRIVER',
    status: 'ACTIVE',
  },
  {
    id: 'usr-002',
    name: 'Trần Thị Bình',
    email: 'binh.tran@example.com',
    phone: '+84912345678',
    role: 'DRIVER',
    status: 'ACTIVE',
  },
];

/**
 * Build a fake session for a user (stand-in for real JWTs).
 * LATER: the real tokens come from the backend; this factory disappears.
 */
export function makeMockSession(user: User): AuthSession {
  return {
    user,
    tokens: {
      accessToken: `mock-access-${user.id}-${Date.now()}`,
      refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
    },
  };
}
