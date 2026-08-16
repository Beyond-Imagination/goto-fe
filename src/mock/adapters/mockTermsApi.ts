import type { TermsApi } from '@/auth/signup/termsApi';
import type { TermDetail, TermsListResponse } from '@/auth/signup/termsContent';
import { MOCK_TERMS_LIST, MOCK_TERMS_MAP } from '../data/mockTerms';

export interface MockTermsApiOptions {
  readonly simulatedDelayMs?: number;
  readonly termsList?: readonly TermDetail[];
}

export function createMockTermsApi(options: MockTermsApiOptions = {}): TermsApi {
  const delay = (ms = options.simulatedDelayMs ?? 30) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const terms = options.termsList ?? MOCK_TERMS_LIST;
  const termsMap = options.termsList
    ? Object.fromEntries(options.termsList.map((t) => [t.id, t]))
    : MOCK_TERMS_MAP;

  return {
    async getTerms(): Promise<TermsListResponse> {
      await delay();
      return { terms };
    },

    async getTerm(termId: string): Promise<TermDetail> {
      await delay();
      const term = termsMap[termId];
      if (!term) {
        throw new Error(`API request failed with status 404: Term not found [${termId}]`);
      }
      return term;
    },
  };
}
