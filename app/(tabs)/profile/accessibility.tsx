import { useRouter } from 'expo-router';

import { AccessibilityProfileScreen } from '@/screens/myinfo/AccessibilityProfileScreen';

export default function AccessibilityProfileRoute() {
  const router = useRouter();

  return <AccessibilityProfileScreen onBack={() => router.back()} />;
}
