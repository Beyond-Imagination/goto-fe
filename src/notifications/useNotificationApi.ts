import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockNotificationApi } from './mockNotificationApi';
import {
  createNotificationApi,
  type NotificationApi,
  type NotificationApiOptions,
} from './notificationApi';

export function getNotificationApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
  options?: NotificationApiOptions,
): NotificationApi {
  return authMode === 'mock' ? createMockNotificationApi() : createNotificationApi(options);
}

export function useNotificationApi(): NotificationApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getNotificationApi(process.env.EXPO_PUBLIC_AUTH_MODE, { getAccessToken: () => accessToken }),
    [accessToken],
  );
}
