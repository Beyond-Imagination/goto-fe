import type { ProviderCredential } from '@/auth/common';

/** 각 OAuth 제공자 SDK를 공통 인증 흐름에 연결하는 어댑터 계약. */
export interface SocialLoginAdapter {
  login(): Promise<ProviderCredential>;
}
