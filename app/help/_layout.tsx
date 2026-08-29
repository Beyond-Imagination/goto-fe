import { Redirect, Stack } from 'expo-router';

import { AUTH_STATUS, useAuth } from '@/auth';

/** 탭 위로 push되는 도움 요청 상세 화면은 로그인 세션을 요구합니다. */
export default function HelpLayout() {
  const { session, status } = useAuth();

  if (status === AUTH_STATUS.restoring) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }} />;
}
