import { getApiBaseUrl } from '@/authApi';

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

type ErrorResponse = {
  errorCode?: string;
  errorMessage?: string;
};

type OAuthSignupRequest = ProviderCredential & OAuthSignupDetails & {
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

export function createOAuthApi(apiBaseUrl: string, fetchImplementation: typeof fetch = fetch): OAuthApi {
  async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const response = await fetchImplementation(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      const error = payload as ErrorResponse;
      throw new AuthApiError(
        response.status,
        error.errorCode,
        error.errorMessage ?? response.statusText ?? '인증 요청에 실패했습니다.',
      );
    }

    return payload as TResponse;
  }

  async function getJson<TResponse>(path: string): Promise<TResponse> {
    const response = await fetchImplementation(`${apiBaseUrl}${path}`);
    const payload = await parseResponse(response);

    if (!response.ok) {
      const error = payload as ErrorResponse;
      throw new AuthApiError(
        response.status,
        error.errorCode,
        error.errorMessage ?? response.statusText ?? '인증 요청에 실패했습니다.',
      );
    }

    return payload as TResponse;
  }

  return {
    async isNicknameAvailable(nickname) {
      const response = await getJson<NicknameAvailabilityResponse>(
        `/api/v1/nicknames/${encodeURIComponent(nickname)}/availability`,
      );
      return response.available;
    },
    oauthLogin: (credential) => postJson<OAuthLoginResponse>('/api/v1/auth/oauth/login', credential),
    async oauthSignup(request) {
      const response = await postJson<OAuthLoginResponse>('/api/v1/auth/oauth/signup', request);

      // signup은 AUTHENTICATED만 유효하다. SIGN_UP_REQUIRED는 login 응답이다.
      if (response.status !== OAUTH_LOGIN_STATUS.authenticated) {
        throw new AuthApiError(500, undefined, '회원가입 응답이 올바르지 않습니다.');
      }

      return {
        session: toPlatformSession(response),
        refreshToken: response.refreshToken,
      };
    },
    async refreshPlatformSession(refreshToken) {
      const response = await postJson<RefreshResponse>('/api/v1/auth/refresh', { refreshToken });
      return toPlatformSession(response);
    },
  };
}

export function isNicknameAvailable(nickname: string): Promise<boolean> {
  return createOAuthApi(getApiBaseUrl()).isNicknameAvailable(nickname);
}

export function oauthLogin(credential: ProviderCredential): Promise<OAuthLoginResponse> {
  return createOAuthApi(getApiBaseUrl()).oauthLogin(credential);
}

export function oauthSignup(request: OAuthSignupRequest): Promise<{
  session: PlatformSession;
  refreshToken: string;
}> {
  return createOAuthApi(getApiBaseUrl()).oauthSignup(request);
}

export function refreshPlatformSession(refreshToken: string): Promise<PlatformSession> {
  return createOAuthApi(getApiBaseUrl()).refreshPlatformSession(refreshToken);
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

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { errorMessage: text };
  }
}
