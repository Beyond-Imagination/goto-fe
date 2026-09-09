import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createFacilityReportApi, type FacilityReportApi } from './facilityReportApi';
import { createMockFacilityReportApi } from './mockFacilityReportApi';

/** mock 모드에서는 서버·로그인 없이 화면을 확인할 수 있도록 인메모리 어댑터를 씁니다. */
export function getFacilityReportApi(
  authMode: string | undefined,
  accessToken: string | undefined,
): FacilityReportApi {
  return authMode === 'mock'
    ? createMockFacilityReportApi()
    : createFacilityReportApi({ getAccessToken: () => accessToken });
}

export function useFacilityReportApi(): FacilityReportApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getFacilityReportApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken),
    [accessToken],
  );
}
