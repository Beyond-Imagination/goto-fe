import { useRouter } from 'expo-router';

import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';

export default function NotificationsRoute() {
  const router = useRouter();

  return (
    <NotificationsScreen
      onBack={() => router.back()}
      onOpen={target => router.push({ pathname: target.pathname as never, params: target.params })}
    />
  );
}
