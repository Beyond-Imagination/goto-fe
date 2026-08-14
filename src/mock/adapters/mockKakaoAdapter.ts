import type { ProviderCredential } from '@/auth/common';
import type { SocialLoginAdapter } from '@/auth/social/socialLoginAdapter';
import { resolveActivePersona, type PersonaDefinition } from '../personas';

export interface MockKakaoAdapterOptions {
  readonly persona?: PersonaDefinition;
  readonly simulatedDelayMs?: number;
}

export function createMockKakaoAdapter(options: MockKakaoAdapterOptions = {}): SocialLoginAdapter {
  const getPersona = () => options.persona ?? resolveActivePersona();
  const delay = (ms = options.simulatedDelayMs ?? 50) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  return {
    async login(): Promise<ProviderCredential> {
      await delay();
      const persona = getPersona();
      return {
        provider: 'KAKAO',
        providerAccessToken: `mock-kakao-token-${persona.id}-${Date.now()}`,
      };
    },
  };
}
