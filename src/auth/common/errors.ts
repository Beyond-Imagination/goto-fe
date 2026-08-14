export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string | undefined,
    message: string,
  ) {
    super(message);
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
