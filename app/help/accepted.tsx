import { useLocalSearchParams, useRouter } from 'expo-router';

import { HelpAcceptedScreen } from '@/screens/help/HelpAcceptedScreen';

export default function AcceptedRoute() {
  const router = useRouter();
  const { helpRequestId } = useLocalSearchParams<{ helpRequestId: string }>();

  return (
    <HelpAcceptedScreen
      helpRequestId={helpRequestId}
      onBack={() => router.dismissAll()}
      onCanceled={() => router.dismissAll()}
    />
  );
}
