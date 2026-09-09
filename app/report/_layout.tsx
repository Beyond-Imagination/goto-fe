import { Stack } from 'expo-router';

import { ReportDraftProvider } from '@/report';

/** 제보 플로우. 유형 → 위치 → 상세 → 완료가 같은 초안을 공유합니다. */
export default function ReportLayout() {
  return (
    <ReportDraftProvider>
      <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }} />
    </ReportDraftProvider>
  );
}
