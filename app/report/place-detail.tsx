import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAsyncResource } from '@/myinfo';
import { PlaceStateReportDetailScreen } from '@/screens/report/PlaceStateReportDetailScreen';
import { usePlaceReportApi } from '@/usePlaceReportApi';

export default function PlaceStateReportDetailRoute() {
  const router = useRouter();
  const api = usePlaceReportApi();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(() => api.get(Number(id)), [api, id]);
  const report = useAsyncResource(load, '제보를 불러오지 못했어요.');

  return (
    <PlaceStateReportDetailScreen
      errorMessage={report.state === 'error' ? (report.errorMessage ?? '제보를 불러오지 못했어요.') : null}
      isLoading={report.state === 'loading'}
      onBack={() => router.back()}
      onRetry={report.reload}
      report={report.data}
    />
  );
}
