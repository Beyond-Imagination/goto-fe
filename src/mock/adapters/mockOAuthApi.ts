import {
  AUTH_ERROR_CODE,
  OAUTH_LOGIN_STATUS,
  AuthApiError,
  type OAuthLoginResponse,
  type PlatformSession,
  type ProviderCredential,
} from '@/auth/common';
import type { OAuthApi } from '@/auth/social/oauthApi';
import { resolveActivePersona, type PersonaDefinition } from '../personas';

export interface MockOAuthApiOptions {
  readonly persona?: PersonaDefinition;
  readonly simulatedDelayMs?: number;
}

export function createMockOAuthApi(options: MockOAuthApiOptions = {}): OAuthApi {
  const getPersona = () => options.persona ?? resolveActivePersona();
  const delay = (ms = options.simulatedDelayMs ?? 50) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  return {
    async isNicknameAvailable(nickname: string): Promise<boolean> {
      await delay();
      const normalized = nickname.trim();
      if (normalized === '이미있는닉네임' || normalized === '중복닉네임') {
        return false;
      }
      return true;
    },

    async oauthLogin(credential: ProviderCredential): Promise<OAuthLoginResponse> {
      await delay();
      const persona = getPersona();

      if (persona.auth.session) {
        return {
          status: OAUTH_LOGIN_STATUS.authenticated,
          accessToken: persona.auth.session.accessToken,
          refreshToken: 'mock-refresh-token-' + persona.id,
          tokenType: persona.auth.session.tokenType,
          expiresIn: persona.auth.session.expiresIn,
        };
      }

      return {
        status: OAUTH_LOGIN_STATUS.signupRequired,
        provider: credential.provider,
        suggestedNickname: persona.auth.pendingSignup?.suggestedNickname ?? '함께가길',
      };
    },

    async oauthSignup(request): Promise<{ session: PlatformSession; refreshToken: string }> {
      await delay();
      const persona = getPersona();

      if (
        persona.id === 'nickname_conflict_user' ||
        request.nickname.trim() === '이미있는닉네임'
      ) {
        throw new AuthApiError(
          409,
          AUTH_ERROR_CODE.nicknameAlreadyInUse,
          '이미 사용 중인 닉네임입니다.',
        );
      }

      const expiresIn = 3600;
      const session: PlatformSession = {
        accessToken: `mock-access-token-${persona.id}-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      return {
        session,
        refreshToken: `mock-refresh-token-${persona.id}-${Date.now()}`,
      };
    },

    async refreshPlatformSession(refreshToken: string): Promise<PlatformSession> {
      await delay();
      if (!refreshToken || refreshToken === 'invalid-refresh-token') {
        throw new AuthApiError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않은 리프레시 토큰입니다.');
      }

      const expiresIn = 3600;
      return {
        accessToken: `mock-refreshed-access-token-${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };
    },
  };
}
