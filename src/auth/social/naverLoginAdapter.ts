import {
  OAuthLoginCancelledError,
  OAuthProviderConfigurationError,
} from '@/auth/common';
import type { SocialLoginAdapter } from './socialLoginAdapter';

export interface NaverLoginConfig {
  consumerKey: string;
  consumerSecret: string;
  appName: string;
  serviceUrlSchemeIOS?: string;
  disableNaverAppAuthIOS?: boolean;
}

export type NaverLoginResult = {
  isSuccess: boolean;
  successResponse?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: string | number;
    expiresAt?: string | number;
    tokenType?: string;
  };
  failureResponse?: {
    isCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
    message?: string;
    responseCode?: string;
  };
};

export type NaverLogin = () => Promise<NaverLoginResult>;
export type NaverInitializer = (config: NaverLoginConfig) => void | Promise<void>;

export function createNaverLoginAdapter(
  config: NaverLoginConfig,
  initialize: NaverInitializer,
  login: NaverLogin,
): SocialLoginAdapter {
  let initialized = false;

  return {
    async login() {
      if (!config.consumerKey || !config.consumerSecret) {
        throw new OAuthProviderConfigurationError(
          '네이버 Consumer Key 또는 Secret이 설정되지 않았습니다. EXPO_PUBLIC_NAVER_CONSUMER_KEY 및 EXPO_PUBLIC_NAVER_CONSUMER_SECRET을 확인해주세요.',
        );
      }

      if (!initialized) {
        await initialize(config);
        initialized = true;
      }

      try {
        const result = await login();
        console.log('[Naver OAuth] Raw login result:', JSON.stringify(result));

        if (result.isSuccess && result.successResponse?.accessToken) {
          return {
            provider: 'NAVER',
            providerAccessToken: result.successResponse.accessToken,
          };
        }

        if (result.failureResponse && isCancellation(result.failureResponse)) {
          throw new OAuthLoginCancelledError();
        }

        const failureMessage =
          result.failureResponse?.errorMessage ||
          result.failureResponse?.message ||
          '네이버 access token을 받지 못했습니다.';

        throw new Error(failureMessage);
      } catch (error) {
        if (error instanceof OAuthLoginCancelledError || isCancellation(error)) {
          throw new OAuthLoginCancelledError();
        }

        console.warn('[Naver OAuth] Native login failed.', toSafeErrorDetails(error));
        throw error;
      }
    },
  };
}

function isCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('isCancel' in error && Boolean(error.isCancel)) {
    return true;
  }

  const code =
    'errorCode' in error && error.errorCode
      ? String(error.errorCode)
      : 'code' in error && error.code
        ? String(error.code)
        : '';
  const message =
    'errorMessage' in error && error.errorMessage
      ? String(error.errorMessage)
      : 'message' in error && error.message
        ? String(error.message)
        : '';

  return /cancel/i.test(code) || /cancel/i.test(message) || /취소/i.test(message);
}

function toSafeErrorDetails(error: unknown): { code?: string; message?: string; type: string } {
  if (!error || typeof error !== 'object') {
    return { type: typeof error };
  }

  const code =
    'errorCode' in error && error.errorCode
      ? String(error.errorCode)
      : 'code' in error && error.code
        ? String(error.code)
        : undefined;

  const message =
    'errorMessage' in error && error.errorMessage
      ? String(error.errorMessage)
      : 'message' in error && error.message
        ? String(error.message)
        : undefined;

  return {
    type: error.constructor?.name ?? 'Error',
    ...(code ? { code } : {}),
    ...(message ? { message } : {}),
  };
}
