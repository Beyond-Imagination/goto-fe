import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createMockMyInfoApi } from './mockMyInfoApi';
import { createMyInfoApi, type MyInfoApi, type MyInfoApiOptions } from './myInfoApi';

export function getMyInfoApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
  options?: MyInfoApiOptions,
): MyInfoApi {
  return authMode === 'mock' ? createMockMyInfoApi() : createMyInfoApi(options);
}

/**
 * 세션의 accessToken을 붙인 내 정보 API를 돌려줍니다.
 * mock 모드에서는 인메모리 어댑터를 쓰므로 세션이 없어도 화면을 확인할 수 있습니다.
 */
export function useMyInfoApi(): MyInfoApi {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  return useMemo(
    () => getMyInfoApi(process.env.EXPO_PUBLIC_AUTH_MODE, { getAccessToken: () => accessToken }),
    [accessToken],
  );
}
