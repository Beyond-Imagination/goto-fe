import { useRouter } from 'expo-router';

import { DisplayStepScreen } from '@/screens/DisplayStepScreen';

export default function DisplayRoute() {
  const router = useRouter();

  return (
    <DisplayStepScreen
      onBack={() => router.back()}
      onDone={() => router.push('/profile/done')}
      onSkip={() => router.push('/profile/done')}
    />
  );
}
