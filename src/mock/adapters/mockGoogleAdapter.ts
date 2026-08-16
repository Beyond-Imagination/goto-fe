import type { ProviderCredential } from '@/auth/common';
import type { SocialLoginAdapter } from '@/auth/social/socialLoginAdapter';
import { resolveActivePersona, type PersonaDefinition } from '../personas';

export interface MockGoogleAdapterOptions {
  readonly persona?: PersonaDefinition;
  readonly simulatedDelayMs?: number;
}

export function createMockGoogleAdapter(options: MockGoogleAdapterOptions = {}): SocialLoginAdapter {
  const getPersona = () => options.persona ?? resolveActivePersona();
  const delay = (ms = options.simulatedDelayMs ?? 50) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  return {
    async login(): Promise<ProviderCredential> {
      await delay();
      const persona = getPersona();
      return {
        provider: 'GOOGLE',
        providerAccessToken: `mock-google-token-${persona.id}-${Date.now()}`,
      };
    },
  };
}
