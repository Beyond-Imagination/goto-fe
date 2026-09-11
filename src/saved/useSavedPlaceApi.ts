import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockSavedPlaceApi } from './mockSavedPlaceApi';
import {
  createSavedPlaceApi,
  type SavedPlaceApi,
  type SavedPlaceApiOptions,
} from './savedPlaceApi';

export function getSavedPlaceApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
  options?: SavedPlaceApiOptions,
): SavedPlaceApi {
  return authMode === 'mock' ? createMockSavedPlaceApi() : createSavedPlaceApi(options);
}

/**
 * 세션의 accessToken을 붙인 저장 장소 API를 돌려줍니다.
 * mock 모드에서는 인메모리 어댑터를 쓰므로 세션이 없어도 저장 화면을 확인할 수 있습니다.
 */
export function useSavedPlaceApi(): SavedPlaceApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () =>
      getSavedPlaceApi(process.env.EXPO_PUBLIC_AUTH_MODE, {
        getAccessToken: () => accessToken,
      }),
    [accessToken],
  );
}
