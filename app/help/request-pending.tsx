import { useLocalSearchParams, useRouter } from 'expo-router';

import { HelpRequestPendingScreen } from '@/screens/help/HelpRequestPendingScreen';

export default function RequestPendingRoute() {
  const router = useRouter();
  const { helpRequestId } = useLocalSearchParams<{ helpRequestId: string }>();

  function goHome() {
    router.dismissAll();
  }

  return (
    <HelpRequestPendingScreen
      helpRequestId={helpRequestId}
      onBack={goHome}
      onCanceled={goHome}
    />
  );
}
