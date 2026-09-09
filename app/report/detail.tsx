import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAsyncResource } from '@/myinfo';
import { ObstacleReportDetailScreen } from '@/screens/report/ObstacleReportDetailScreen';
import { useObstacleReportApi } from '@/useObstacleReportApi';

export default function ObstacleReportDetailRoute() {
  const router = useRouter();
  const api = useObstacleReportApi();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(() => api.get(Number(id)), [api, id]);
  const report = useAsyncResource(load, '제보를 불러오지 못했어요.');

  return (
    <ObstacleReportDetailScreen
      errorMessage={report.state === 'error' ? (report.errorMessage ?? '제보를 불러오지 못했어요.') : null}
      isLoading={report.state === 'loading'}
      onBack={() => router.back()}
      onRetry={report.reload}
      report={report.data}
    />
  );
}
