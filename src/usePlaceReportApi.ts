import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockPlaceReportApi } from './mockPlaceReportApi';
import { createPlaceReportApi, type PlaceReportApi } from './placeReportApi';

/** mock 모드에서는 서버·로그인 없이 화면을 확인할 수 있도록 인메모리 어댑터를 씁니다. */
export function getPlaceReportApi(
  authMode: string | undefined,
  accessToken: string | undefined,
): PlaceReportApi {
  return authMode === 'mock'
    ? createMockPlaceReportApi()
    : createPlaceReportApi({ getAccessToken: () => accessToken });
}

export function usePlaceReportApi(): PlaceReportApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(() => getPlaceReportApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken), [accessToken]);
}
