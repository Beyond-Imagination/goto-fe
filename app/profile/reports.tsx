import { useLocalSearchParams, useRouter } from 'expo-router';

import { MyReportsScreen } from '@/screens/myinfo/MyReportsScreen';

export default function MyReportsRoute() {
  const router = useRouter();
  // `/profile/reports?empty=1` 로 열면 빈 상태(내 정보 04)를 바로 확인할 수 있습니다.
  const { empty } = useLocalSearchParams<{ empty?: string }>();

  return (
    <MyReportsScreen
      forceEmpty={empty === '1'}
      onBack={() => router.back()}
      onStartReport={() => router.navigate('/report')}
    />
  );
}
