import { useRouter } from 'expo-router';

import { ProfileDoneScreen } from '@/screens/ProfileDoneScreen';

export default function ProfileDoneRoute() {
  const router = useRouter();

  const handleExplore = () => {
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return <ProfileDoneScreen onExplore={handleExplore} />;
}
