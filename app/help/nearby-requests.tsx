import { useRouter } from 'expo-router';

import { HELP_ROUTE } from '@/help';
import { NearbyHelpRequestsScreen } from '@/screens/help/NearbyHelpRequestsScreen';

export default function NearbyRequestsRoute() {
  const router = useRouter();

  return (
    <NearbyHelpRequestsScreen
      onBack={() => router.back()}
      onSelect={helpRequestId =>
        router.push({ params: { helpRequestId }, pathname: HELP_ROUTE.requestReview })
      }
    />
  );
}
