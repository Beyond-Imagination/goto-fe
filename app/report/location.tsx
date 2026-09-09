import { useRouter } from 'expo-router';

import { REPORT_KIND, useReportDraft } from '@/report';
import { ReportLocationScreen } from '@/screens/report/ReportLocationScreen';

/** 제보 종류별 다음 화면. 장소·시설 제보는 장소를 골라야 진행할 수 있습니다. */
const NEXT_PATH = {
  [REPORT_KIND.placeState]: '/report/place',
  [REPORT_KIND.facilityState]: '/report/facility',
  [REPORT_KIND.obstacle]: '/report/obstacle',
} as const;

export default function ReportLocationRoute() {
  const router = useRouter();
  const { draft } = useReportDraft();

  return (
    <ReportLocationScreen
      onBack={() => router.back()}
      onNext={() => router.push(NEXT_PATH[draft.kind ?? REPORT_KIND.obstacle])}
      // 장소·시설 제보는 좌표가 아니라 장소(또는 그 안의 시설)에 붙으므로 장소 선택이 필수입니다.
      requiresPlace={draft.kind !== REPORT_KIND.obstacle}
    />
  );
}
