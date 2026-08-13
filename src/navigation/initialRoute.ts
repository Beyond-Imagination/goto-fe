import { AUTH_STATUS, type AuthStatus } from '@/auth/common/constants';

export type InitialRoute = '/(tabs)' | '/login' | null;

export function getInitialRoute(
  status: AuthStatus,
  hasSession: boolean,
  splashComplete: boolean,
): InitialRoute {
  if (status === AUTH_STATUS.restore_failed) {
    return '/login';
  }

  if (!splashComplete || status === AUTH_STATUS.restoring) {
    return null;
  }

  return hasSession ? '/(tabs)' : '/login';
}
