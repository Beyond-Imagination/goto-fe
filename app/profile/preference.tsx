import { useRouter } from 'expo-router';

import { PreferenceStepScreen } from '@/screens/PreferenceStepScreen';

export default function PreferenceRoute() {
  const router = useRouter();

  return (
    <PreferenceStepScreen
      onBack={() => router.back()}
      onNext={() => router.push('/profile/display')}
      onSkip={() => router.replace('/signup/complete')}
    />
  );
}
