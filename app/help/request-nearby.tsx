import { useRouter } from 'expo-router';

import { HELP_ROUTE } from '@/help';
import { HelpLocationScreen } from '@/screens/help/HelpLocationScreen';

export default function RequestNearbyRoute() {
  const router = useRouter();

  return (
    <HelpLocationScreen
      onBack={() => router.back()}
      onNext={() => router.push(HELP_ROUTE.requestDetail)}
    />
  );
}
