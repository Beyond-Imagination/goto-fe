import { useRouter } from 'expo-router';

import { SplashScreen } from '@/screens/SplashScreen';

export default function SplashRoute() {
  const router = useRouter();

  return <SplashScreen onDone={() => router.replace('/onboarding')} />;
}
