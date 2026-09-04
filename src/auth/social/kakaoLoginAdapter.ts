import {
  OAuthLoginCancelledError,
  OAuthProviderConfigurationError,
} from '@/auth/common';
import { logger } from '@/utils/logger';
import type { SocialLoginAdapter } from './socialLoginAdapter';

type KakaoLogin = () => Promise<{ accessToken: string }>;
type KakaoInitializer = (nativeAppKey: string) => void | Promise<void>;

export function createKakaoLoginAdapter(
  nativeAppKey: string,
  initialize: KakaoInitializer,
  login: KakaoLogin,
): SocialLoginAdapter {
  let initialized = false;

  return {
    async login() {
      if (!nativeAppKey) {
        throw new OAuthProviderConfigurationError(
          '카카오 Native App Key가 설정되지 않았습니다. EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY를 확인해주세요.',
        );
      }

      if (!initialized) {
        await initialize(nativeAppKey);
        initialized = true;
      }

      try {
        const token = await login();

        if (!token.accessToken) {
          throw new Error('카카오 access token을 받지 못했습니다.');
        }

        return {
          provider: 'KAKAO',
          providerAccessToken: token.accessToken,
        };
      } catch (error) {
        if (isCancellation(error)) {
          throw new OAuthLoginCancelledError();
        }

        logger.warn('[Kakao OAuth] Native login failed.', toSafeErrorDetails(error));
        throw error;
      }
    },
  };
}

function isCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';

  return /cancel/i.test(code) || /cancel/i.test(message);
}

function toSafeErrorDetails(error: unknown): { code?: string; message?: string; type: string } {
  if (!error || typeof error !== 'object') {
    return { type: typeof error };
  }

  // SDK 원본에는 access token이 있을 수 있어 code/message만 남긴다.
  return {
    type: error.constructor?.name ?? 'Error',
    ...('code' in error && error.code ? { code: String(error.code) } : {}),
    ...('message' in error && error.message ? { message: String(error.message) } : {}),
  };
}
