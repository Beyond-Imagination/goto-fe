import { useRouter } from 'expo-router';

import { ProfileDoneScreen } from '@/screens/ProfileDoneScreen';

export default function ProfileDoneRoute() {
  const router = useRouter();

  return <ProfileDoneScreen onRestart={() => router.dismissTo('/onboarding')} />;
}
