import { useLocalSearchParams, useRouter } from 'expo-router';

import { MyReportsScreen } from '@/screens/myinfo/MyReportsScreen';

/** 제보 종류마다 상세 화면이 다릅니다. */
const DETAIL_PATH = {
  obstacle: '/report/detail',
  place: '/report/place-detail',
  facility: '/report/facility-detail',
} as const;

export default function MyReportsRoute() {
  const router = useRouter();
  // `/profile/reports?empty=1` 로 열면 빈 상태(내 정보 04)를 바로 확인할 수 있습니다.
  const { empty } = useLocalSearchParams<{ empty?: string }>();

  return (
    <MyReportsScreen
      forceEmpty={empty === '1'}
      onBack={() => router.back()}
      onOpenMap={() => router.push('/profile/reports-map')}
      onOpenReport={item => router.push(`${DETAIL_PATH[item.kind]}?id=${item.id}`)}
      onStartReport={() => router.push('/report/kind')}
    />
  );
}
