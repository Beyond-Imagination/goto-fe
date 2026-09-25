import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { buildDummyClusters } from './dummyObstacleClusters';
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

  return useMemo(() => {
    const api = getObstacleReportApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken);
    // 개발 전용: 백엔드에 제보가 없어도 중간/가까운 줌 화면을 확인할 수 있게 클러스터만 더미로 바꾼다.
    // __DEV__ 가드라 릴리스 빌드에서는 env 값과 무관하게 절대 켜지지 않는다.
    if (__DEV__ && process.env.EXPO_PUBLIC_DEV_DUMMY_CLUSTERS === 'true') {
      return { ...api, getClusters: async (bbox, zoom) => buildDummyClusters(bbox, zoom) };
    }
    return api;
  }, [accessToken]);
}
