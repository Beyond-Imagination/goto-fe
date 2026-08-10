import { useRouter } from 'expo-router';

import { MobilityStepScreen } from '@/screens/MobilityStepScreen';

export default function MobilityRoute() {
  const router = useRouter();

  return (
    <MobilityStepScreen
      onBack={() => router.back()}
      onNext={() => router.push('/profile/preference')}
      onSkip={() => router.push('/profile/done')}
    />
  );
}
