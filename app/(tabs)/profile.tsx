import { useRouter } from 'expo-router';

import { MyInfoHomeScreen } from '@/screens/myinfo/MyInfoHomeScreen';

export default function ProfileRoute() {
  const router = useRouter();

  return <MyInfoHomeScreen onNavigate={href => router.push(href as never)} />;
}
