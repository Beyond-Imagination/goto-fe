import { createHttpClient, getApiBaseUrl } from '@/api';

import {
  OAUTH_LOGIN_STATUS,
  AuthApiError,
  OAuthLoginResponse,
  OAuthProvider,
  OAuthSignupDetails,
  OAuthSignupPreferences,
  PlatformSession,
  ProviderCredential,
} from '@/auth/common';

type OAuthSignupRequest = ProviderCredential &
  OAuthSignupDetails & {
    preferences: OAuthSignupPreferences;
  };

type RefreshResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

type NicknameAvailabilityResponse = {
  available: boolean;
};

export type OAuthApi = {
  isNicknameAvailable(nickname: string): Promise<boolean>;
  oauthLogin(credential: ProviderCredential): Promise<OAuthLoginResponse>;
  oauthSignup(request: OAuthSignupRequest): Promise<{ session: PlatformSession; refreshToken: string }>;
  refreshPlatformSession(refreshToken: string): Promise<PlatformSession>;
};

export function createOAuthApi(apiBaseUrl: string = getApiBaseUrl(), fetchImplementation?: typeof fetch): OAuthApi {
  const client = createHttpClient({
    baseUrl: apiBaseUrl,
    fetch: fetchImplementation,
  });

  return {
    async isNicknameAvailable(nickname) {
      try {
        const response = await client.get<NicknameAvailabilityResponse>(
          `/api/v1/nicknames/${encodeURIComponent(nickname)}/availability`,
        );
        return response.available;
      } catch (error) {
        throw toAuthApiError(error);
      }
    },

    async oauthLogin(credential) {
      try {
        return await client.post<OAuthLoginResponse, ProviderCredential>(
          '/api/v1/auth/oauth/login',
          credential,
        );
      } catch (error) {
        throw toAuthApiError(error);
      }
    },

    async oauthSignup(request) {
      try {
        const response = await client.post<OAuthLoginResponse, OAuthSignupRequest>(
          '/api/v1/auth/oauth/signup',
          request,
        );

        // signup은 AUTHENTICATED만 유효하다. SIGN_UP_REQUIRED는 login 응답이다.
        if (response.status !== OAUTH_LOGIN_STATUS.authenticated) {
          throw new AuthApiError(500, undefined, '회원가입 응답이 올바르지 않습니다.');
        }

        return {
          session: toPlatformSession(response),
          refreshToken: response.refreshToken,
        };
      } catch (error) {
        throw toAuthApiError(error);
      }
    },

    async refreshPlatformSession(refreshToken) {
      try {
        const response = await client.post<RefreshResponse, { refreshToken: string }>(
          '/api/v1/auth/refresh',
          { refreshToken },
        );
        return toPlatformSession(response);
      } catch (error) {
        throw toAuthApiError(error);
      }
    },
  };
}

function toAuthApiError(error: unknown): unknown {
  if (error instanceof AuthApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as { status: number; errorCode?: string; message: string; data?: unknown };
    return new AuthApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}

export function isNicknameAvailable(nickname: string): Promise<boolean> {
  return createOAuthApi().isNicknameAvailable(nickname);
}

export function oauthLogin(credential: ProviderCredential): Promise<OAuthLoginResponse> {
  return createOAuthApi().oauthLogin(credential);
}

export function oauthSignup(request: OAuthSignupRequest): Promise<{
  session: PlatformSession;
  refreshToken: string;
}> {
  return createOAuthApi().oauthSignup(request);
}

export function refreshPlatformSession(refreshToken: string): Promise<PlatformSession> {
  return createOAuthApi().refreshPlatformSession(refreshToken);
}

export function toPlatformSession(response: {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}): PlatformSession {
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    expiresAt: Date.now() + response.expiresIn * 1000,
  };
}

export function toOAuthProvider(provider: string): OAuthProvider {
  return provider.toUpperCase() as OAuthProvider;
}
