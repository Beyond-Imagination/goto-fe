import { createHttpClient, getApiBaseUrl } from '@/api';
import { createMockTermsApi } from '@/mock/adapters/mockTermsApi';
import type { TermDetail, TermsListResponse } from './termsContent';

export type TermsApi = {
  getTerms(): Promise<TermsListResponse>;
  getTerm(termId: string): Promise<TermDetail>;
};

export function createTermsApi(
  apiBaseUrl: string = getApiBaseUrl(),
  fetchImplementation?: typeof fetch,
): TermsApi {
  const client = createHttpClient({
    baseUrl: apiBaseUrl,
    fetch: fetchImplementation,
  });

  return {
    async getTerms() {
      try {
        return await client.get<TermsListResponse>('/api/v1/terms');
      } catch (error: any) {
        throw new Error(
          `API request failed with status ${error.status || 500}: ${error.message || 'Error'}`,
        );
      }
    },
    async getTerm(termId: string) {
      try {
        return await client.get<TermDetail>(`/api/v1/terms/${encodeURIComponent(termId)}`);
      } catch (error: any) {
        throw new Error(
          `API request failed with status ${error.status || 500}: ${error.message || 'Error'}`,
        );
      }
    },
  };
}

/**
 * 백엔드 활성 약관 목록을 조회합니다. (Mock 모드 시 mockTermsApi 사용)
 */
export async function fetchTermsList(
  apiBaseUrl: string = getApiBaseUrl(),
  fetchImplementation?: typeof fetch,
): Promise<readonly TermDetail[]> {
  if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
    const mockApi = createMockTermsApi();
    const response = await mockApi.getTerms();
    return response.terms;
  }

  const api = createTermsApi(apiBaseUrl, fetchImplementation);
  const response = await api.getTerms();
  return response.terms ?? [];
}

/**
 * 특정 약관 단건 상세 정보를 조회합니다. (Mock 모드 시 mockTermsApi 사용)
 */
export async function fetchTermDetail(
  termId: string,
  apiBaseUrl: string = getApiBaseUrl(),
  fetchImplementation?: typeof fetch,
): Promise<TermDetail> {
  if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
    const mockApi = createMockTermsApi();
    return mockApi.getTerm(termId);
  }

  const api = createTermsApi(apiBaseUrl, fetchImplementation);
  return api.getTerm(termId);
}
