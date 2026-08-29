import { createHttpClient, getApiBaseUrl } from '@/api';

export { getApiBaseUrl };

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type RefreshResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type AuthResult =
  | {
      type: 'login';
      response: LoginResponse;
      decoded: DecodedTokens;
    }
  | {
      type: 'refresh';
      response: RefreshResponse;
      decoded: DecodedTokens;
    };

export type DecodedJwt = {
  header: unknown;
  payload: unknown;
};

export type DecodedTokens = {
  accessToken?: DecodedJwt;
  refreshToken?: DecodedJwt;
};

const DEMO_CREDENTIALS = {
  username: 'demo',
  password: 'demo',
};

const defaultHttpClient = createHttpClient();

export async function login(): Promise<AuthResult> {
  const response = await defaultHttpClient.post<LoginResponse, typeof DEMO_CREDENTIALS>(
    '/api/v1/auth/login',
    DEMO_CREDENTIALS,
  );

  return {
    type: 'login',
    response,
    decoded: decodeTokens(response),
  };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const response = await defaultHttpClient.post<RefreshResponse, { refreshToken: string }>(
    '/api/v1/auth/refresh',
    { refreshToken },
  );

  return {
    type: 'refresh',
    response,
    decoded: decodeTokens(response),
  };
}

function decodeTokens(response: LoginResponse | RefreshResponse): DecodedTokens {
  const decoded: DecodedTokens = {};

  try {
    decoded.accessToken = decodeJwt(response.accessToken);
  } catch (error) {
    console.warn('Failed to decode accessToken:', error);
  }

  if ('refreshToken' in response) {
    try {
      decoded.refreshToken = decodeJwt(response.refreshToken);
    } catch (error) {
      console.warn('Failed to decode refreshToken:', error);
    }
  }

  return decoded;
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT format.');
  }

  const [encodedHeader, encodedPayload] = parts;

  return {
    header: parseBase64UrlJson(encodedHeader),
    payload: parseBase64UrlJson(encodedPayload),
  };
}

function parseBase64UrlJson(value: string): unknown {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  if (typeof atob !== 'function') {
    throw new Error('JWT decoding requires atob support.');
  }

  return JSON.parse(atob(padded));
}
