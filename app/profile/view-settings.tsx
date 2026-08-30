import { useRouter } from 'expo-router';

import { ViewSettingsScreen } from '@/screens/myinfo/ViewSettingsScreen';

export default function ViewSettingsRoute() {
  const router = useRouter();

  return <ViewSettingsScreen onBack={() => router.back()} />;
}
