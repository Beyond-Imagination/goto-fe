import { useRouter } from 'expo-router';

import { ConfirmedReportsScreen } from '@/screens/myinfo/ConfirmedReportsScreen';

export default function ConfirmedReportsRoute() {
  const router = useRouter();

  return <ConfirmedReportsScreen onBack={() => router.back()} />;
}
