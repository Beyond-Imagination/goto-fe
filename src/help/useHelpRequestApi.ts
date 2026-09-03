import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createHelpRequestApi, type HelpRequestApi } from './helpRequestApi';

/** 로그인 세션의 accessToken을 붙인 도움 요청 API를 돌려줍니다. */
export function useHelpRequestApi(): HelpRequestApi {
  const { session } = useAuth();

  return useMemo(
    () => createHelpRequestApi({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );
}
