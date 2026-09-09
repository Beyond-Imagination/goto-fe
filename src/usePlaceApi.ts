import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockPlaceApi } from './mockPlaceApi';
import { createPlaceApi, type PlaceApi } from './placeApi';

/** mock 모드에서는 서버·로그인 없이 화면을 확인할 수 있도록 인메모리 어댑터를 씁니다. */
export function getPlaceApi(authMode: string | undefined, accessToken: string | undefined): PlaceApi {
  return authMode === 'mock'
    ? createMockPlaceApi()
    : createPlaceApi({ getAccessToken: () => accessToken });
}

export function usePlaceApi(): PlaceApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(() => getPlaceApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken), [accessToken]);
}
