import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createObstacleReportApi, type ObstacleReportApi } from './obstacleReportApi';

export function useObstacleReportApi(): ObstacleReportApi {
  const { session } = useAuth();

  return useMemo(
    () => createObstacleReportApi({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );
}
