import { useLocalSearchParams, useRouter } from 'expo-router';

import { HELP_ROUTE } from '@/help';
import { HelpRequestDetailScreen } from '@/screens/help/HelpRequestDetailScreen';

export default function RequestReviewRoute() {
  const router = useRouter();
  const { helpRequestId } = useLocalSearchParams<{ helpRequestId: string }>();

  return (
    <HelpRequestDetailScreen
      helpRequestId={helpRequestId}
      onAccepted={acceptedId =>
        router.replace({ params: { helpRequestId: acceptedId }, pathname: HELP_ROUTE.accepted })
      }
      onBack={() => router.back()}
      onRejected={() => router.back()}
    />
  );
}
