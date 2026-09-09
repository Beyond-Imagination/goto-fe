import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createHelpRequestApi, type HelpRequestApi } from './helpRequestApi';
import { createMockHelpRequestApi } from './mockHelpRequestApi';

/** mock 모드에서는 서버·로그인 없이 화면을 확인할 수 있도록 인메모리 어댑터를 씁니다. */
export function getHelpRequestApi(
  authMode: string | undefined,
  accessToken: string | undefined,
): HelpRequestApi {
  return authMode === 'mock'
    ? createMockHelpRequestApi()
    : createHelpRequestApi({ getAccessToken: () => accessToken });
}

/** 로그인 세션의 accessToken을 붙인 도움 요청 API를 돌려줍니다. */
export function useHelpRequestApi(): HelpRequestApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getHelpRequestApi(process.env.EXPO_PUBLIC_AUTH_MODE, accessToken),
    [accessToken],
  );
}
