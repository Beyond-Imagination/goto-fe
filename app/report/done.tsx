import { useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAsyncResource } from '@/myinfo';
import {
  toFacilityDoneSummary,
  toObstacleDoneSummary,
  toPlaceDoneSummary,
  useReportDraft,
} from '@/report';
import { ReportDoneScreen, type ReportDoneSummary } from '@/screens/report/ReportDoneScreen';
import { useFacilityReportApi } from '@/useFacilityReportApi';
import { useObstacleReportApi } from '@/useObstacleReportApi';
import { usePlaceReportApi } from '@/usePlaceReportApi';

/** 완료 화면은 제보 종류마다 문구·카드·버튼이 다릅니다 (제보 07·08·09). */
type DoneKind = 'obstacle' | 'place' | 'facility';

export default function ReportDoneRoute() {
  const router = useRouter();
  const obstacleApi = useObstacleReportApi();
  const placeApi = usePlaceReportApi();
  const facilityApi = useFacilityReportApi();
  const { draft, resetDraft } = useReportDraft();
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();

  const doneKind: DoneKind = kind === 'place' ? 'place' : kind === 'facility' ? 'facility' : 'obstacle';
  const placeName = draft.placeName;

  // 등록 직후 서버 상태를 그대로 보여주기 위해 다시 조회합니다.
  const load = useCallback(async (): Promise<ReportDoneSummary> => {
    const reportId = Number(id);

    if (doneKind === 'place') {
      return toPlaceDoneSummary(await placeApi.get(reportId));
    }
    if (doneKind === 'facility') {
      return toFacilityDoneSummary(await facilityApi.get(reportId));
    }
    return toObstacleDoneSummary(await obstacleApi.get(reportId), placeName);
  }, [doneKind, facilityApi, id, obstacleApi, placeApi, placeName]);

  const summary = useAsyncResource(load, '제보 정보를 불러오지 못했어요.');

  function goTo(path: '/(tabs)' | '/profile/reports') {
    resetDraft();
    router.dismissTo('/(tabs)/report');
    router.push(path);
  }

  return (
    <ReportDoneScreen
      onClose={() => {
        resetDraft();
        router.dismissTo('/(tabs)/report');
      }}
      // 장애물은 지도에서 바로 확인하고, 장소·시설은 아직 상세 화면이 없어 내 제보 기록으로 보냅니다.
      onPrimaryAction={() => goTo(doneKind === 'obstacle' ? '/(tabs)' : '/profile/reports')}
      onReportAgain={() => {
        resetDraft();
        router.replace('/report/kind');
      }}
      summary={summary.data}
    />
  );
}
