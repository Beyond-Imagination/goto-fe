import { useRouter } from 'expo-router';

import { HELP_ROUTE } from '@/help';
import { HelpRequestFormScreen } from '@/screens/help/HelpRequestFormScreen';

export default function RequestDetailRoute() {
  const router = useRouter();

  return (
    <HelpRequestFormScreen
      onBack={() => router.back()}
      // 전송이 끝나면 뒤로가기로 폼에 되돌아오지 않도록 대기 화면으로 교체합니다.
      onSubmitted={helpRequestId =>
        router.replace({ params: { helpRequestId }, pathname: HELP_ROUTE.requestPending })
      }
    />
  );
}
