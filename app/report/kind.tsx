import { useRouter } from 'expo-router';

import { ReportKindScreen } from '@/screens/report/ReportKindScreen';

export default function ReportKindRoute() {
  const router = useRouter();

  return (
    // 장소 상태 제보도 같은 위치 화면을 거칩니다. 거기서 장소를 골라야 등록할 수 있습니다.
    <ReportKindScreen onBack={() => router.back()} onNext={() => router.push('/report/location')} />
  );
}
