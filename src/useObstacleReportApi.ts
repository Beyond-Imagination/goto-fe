import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockObstacleReportApi } from './mockObstacleReportApi';
import { createObstacleReportApi, type ObstacleReportApi } from './obstacleReportApi';

/** mock 모드에서는 서버·로그인 없이 화면을 확인할 수 있도록 인메모리 어댑터를 씁니다. */
export function getObstacleReportApi(
  authMode: string | undefined,
  accessToken: string | undefined,
): ObstacleReportApi {
  return authMode === 'mock'
    ? createMockObstacleReportApi()
    : createObstacleReportApi({ getAccessToken: () => accessToken });
}

export function useObstacleReportApi(): ObstacleReportApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getObstacleReportApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken),
    [accessToken],
  );
}
