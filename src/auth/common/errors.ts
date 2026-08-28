import { ApiError } from '@/api/apiError';

export class AuthApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'AuthApiError';
  }
}

export class OAuthLoginCancelledError extends Error {
  constructor() {
    super('OAuth login was cancelled.');
    this.name = 'OAuthLoginCancelledError';
  }
}

export class OAuthProviderUnavailableError extends Error {
  constructor() {
    super('이 로그인 방식은 현재 준비 중입니다.');
    this.name = 'OAuthProviderUnavailableError';
  }
}

export class OAuthProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthProviderConfigurationError';
  }
}
