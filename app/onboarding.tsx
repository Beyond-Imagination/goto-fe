import { useLocalSearchParams, useRouter } from 'expo-router';

import { OnboardingScreen } from '@/screens/OnboardingScreen';

/** `/onboarding?page=1` 로 특정 페이지부터 열 수 있습니다. QA와 스크린샷 캡처에 씁니다. */
export default function OnboardingRoute() {
  const router = useRouter();
  const { page } = useLocalSearchParams<{ page?: string }>();

  return (
    <OnboardingScreen
      initialPage={Number(page ?? 0) || 0}
      onStart={() => router.push('/permission')}
    />
  );
}
