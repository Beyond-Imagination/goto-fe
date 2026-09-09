import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAsyncResource } from '@/myinfo';
import { FacilityReportDetailScreen } from '@/screens/report/FacilityReportDetailScreen';
import { useFacilityReportApi } from '@/useFacilityReportApi';

export default function FacilityReportDetailRoute() {
  const router = useRouter();
  const api = useFacilityReportApi();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const load = useCallback(() => api.get(Number(id)), [api, id]);
  const report = useAsyncResource(load, '제보를 불러오지 못했어요.');

  return (
    <FacilityReportDetailScreen
      errorMessage={report.state === 'error' ? (report.errorMessage ?? '제보를 불러오지 못했어요.') : null}
      isLoading={report.state === 'loading'}
      onBack={() => router.back()}
      onRetry={report.reload}
      report={report.data}
    />
  );
}
