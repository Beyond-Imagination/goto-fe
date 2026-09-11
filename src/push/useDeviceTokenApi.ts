import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createDeviceTokenApi, type DeviceTokenApi, type DeviceTokenApiOptions } from './deviceTokenApi';
import { createMockDeviceTokenApi } from './mockDeviceTokenApi';

export function getDeviceTokenApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
  options?: DeviceTokenApiOptions,
): DeviceTokenApi {
  return authMode === 'mock' ? createMockDeviceTokenApi() : createDeviceTokenApi(options);
}

export function useDeviceTokenApi(): DeviceTokenApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getDeviceTokenApi(process.env.EXPO_PUBLIC_AUTH_MODE, { getAccessToken: () => accessToken }),
    [accessToken],
  );
}
