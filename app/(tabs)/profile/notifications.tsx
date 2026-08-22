import { useRouter } from 'expo-router';

import { NotificationSettingsScreen } from '@/screens/myinfo/NotificationSettingsScreen';

export default function NotificationSettingsRoute() {
  const router = useRouter();

  return <NotificationSettingsScreen onBack={() => router.back()} />;
}
