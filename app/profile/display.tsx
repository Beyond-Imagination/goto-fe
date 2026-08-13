import { useRouter } from 'expo-router';

import { DisplayStepScreen } from '@/screens/DisplayStepScreen';

export default function DisplayRoute() {
  const router = useRouter();

  return (
    <DisplayStepScreen
      onBack={() => router.back()}
      onDone={() => router.push('/signup/complete')}
      onSkip={() => router.push('/signup/complete')}
    />
  );
}
