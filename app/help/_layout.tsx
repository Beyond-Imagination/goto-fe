import { Redirect, Stack } from 'expo-router';

import { AUTH_STATUS, useAuth } from '@/auth';
import { HelpRequestDraftProvider } from '@/help';

/** 탭 위로 push되는 도움 요청 상세 화면은 로그인 세션을 요구합니다. */
export default function HelpLayout() {
  const { session, status } = useAuth();

  if (status === AUTH_STATUS.restoring) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    // 위치 → 내용 → 대기 3단계가 같은 요청 초안을 공유합니다.
    <HelpRequestDraftProvider>
      <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }} />
    </HelpRequestDraftProvider>
  );
}
