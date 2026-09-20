import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useReportDraft } from '@/report';
import { PlaceStateReportFormScreen } from '@/screens/report/PlaceStateReportFormScreen';

export default function PlaceStateReportRoute() {
  const router = useRouter();
  const { patchDraft } = useReportDraft();
  const { placeId, placeName } = useLocalSearchParams<{ placeId?: string; placeName?: string; facility?: string }>();

  useEffect(() => {
    const parsedPlaceId = placeId ? Number(placeId) : NaN;
    if (!Number.isFinite(parsedPlaceId)) {
      return;
    }
    patchDraft({
      placeId: parsedPlaceId,
      placeName: placeName ?? null,
    });
  }, [patchDraft, placeId, placeName]);

  return (
    <PlaceStateReportFormScreen
      onBack={() => router.back()}
      onSubmitted={report => router.replace(`/report/done?kind=place&id=${String(report.id)}`)}
    />
  );
}
