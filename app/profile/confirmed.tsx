import { useRouter } from 'expo-router';

import { ConfirmedReportsScreen } from '@/screens/myinfo/ConfirmedReportsScreen';

export default function ConfirmedReportsRoute() {
  const router = useRouter();

  return (
    <ConfirmedReportsScreen
      onBack={() => router.back()}
      // 내가 확인한 리포트는 항상 장애물 제보입니다.
      onOpenReport={id => router.push(`/report/detail?id=${id}`)}
    />
  );
}
