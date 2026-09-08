import { useRouter } from 'expo-router';

import { MyReportsMapScreen } from '@/screens/myinfo/MyReportsMapScreen';

export default function MyReportsMapRoute() {
  const router = useRouter();

  return <MyReportsMapScreen onBack={() => router.back()} />;
}
