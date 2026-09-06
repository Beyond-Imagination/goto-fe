import {
  OAuthLoginCancelledError,
  OAuthProviderConfigurationError,
} from '@/auth/common';
import { logger } from '@/utils/logger';
import type { SocialLoginAdapter } from './socialLoginAdapter';

export interface GoogleLoginConfig {
  webClientId?: string;
  iosClientId?: string;
  scopes?: string[];
}

export type GoogleConfigure = (config: GoogleLoginConfig) => void;
export type GoogleHasPlayServices = (options?: { showPlayServicesUpdateDialog: boolean }) => Promise<boolean>;
export type GoogleSignIn = () => Promise<unknown>;
export type GoogleGetTokens = () => Promise<{ accessToken: string; idToken?: string }>;

export function createGoogleLoginAdapter(
  config: GoogleLoginConfig,
  configure: GoogleConfigure,
  hasPlayServices: GoogleHasPlayServices,
  signIn: GoogleSignIn,
  getTokens: GoogleGetTokens,
): SocialLoginAdapter {
  let initialized = false;

  return {
    async login() {
      if (!config.webClientId && !config.iosClientId) {
        throw new OAuthProviderConfigurationError(
          '구글 Client ID가 설정되지 않았습니다. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 또는 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID를 확인해주세요.',
        );
      }

      if (!initialized) {
        configure(config);
        initialized = true;
      }

      try {
        await hasPlayServices({ showPlayServicesUpdateDialog: true });
        await signIn();
        const tokens = await getTokens();

        if (!tokens?.accessToken) {
          throw new Error('구글 access token을 받지 못했습니다.');
        }

        return {
          provider: 'GOOGLE',
          providerAccessToken: tokens.accessToken,
        };
      } catch (error) {
        if (isCancellation(error)) {
          throw new OAuthLoginCancelledError();
        }

        logger.warn('[Google OAuth] Native login failed.', toSafeErrorDetails(error));
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

  return (
    code === '12501' ||
    code === 'SIGN_IN_CANCELLED' ||
    /cancel/i.test(code) ||
    /cancel/i.test(message) ||
    /취소/i.test(message)
  );
}

function toSafeErrorDetails(error: unknown): { code?: string; message?: string; type: string } {
  if (!error || typeof error !== 'object') {
    return { type: typeof error };
  }

  // SDK 원본에는 토큰이 포함될 수 있어 type, code, message만 안전하게 추출한다.
  return {
    type: error.constructor?.name ?? 'Error',
    ...('code' in error && error.code ? { code: String(error.code) } : {}),
    ...('message' in error && error.message ? { message: String(error.message) } : {}),
  };
}
