import { useRouter } from 'expo-router';

import { PermissionScreen } from '@/screens/PermissionScreen';

export default function PermissionRoute() {
  const router = useRouter();

  return (
    <PermissionScreen
      onBack={() => router.back()}
      onConfirm={() => router.push('/profile/mobility')}
      onSkip={() => router.push('/profile/mobility')}
    />
  );
}
