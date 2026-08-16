import { getApiBaseUrl } from '@/authApi';
import { createMockTermsApi } from '@/mock/adapters/mockTermsApi';
import type { TermDetail, TermsListResponse } from './termsContent';

export type TermsApi = {
  getTerms(): Promise<TermsListResponse>;
  getTerm(termId: string): Promise<TermDetail>;
};

export function createTermsApi(
  apiBaseUrl: string,
  fetchImplementation: typeof fetch = fetch,
): TermsApi {
  async function getJson<TResponse>(path: string): Promise<TResponse> {
    const response = await fetchImplementation(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TResponse;
  }

  return {
    getTerms: () => getJson<TermsListResponse>('/api/v1/terms'),
    getTerm: (termId: string) => getJson<TermDetail>(`/api/v1/terms/${encodeURIComponent(termId)}`),
  };
}

/**
 * 백엔드 활성 약관 목록을 조회합니다. (Mock 모드 시 mockTermsApi 사용)
 */
export async function fetchTermsList(
  apiBaseUrl: string = getApiBaseUrl(),
  fetchImplementation: typeof fetch = fetch,
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
  fetchImplementation: typeof fetch = fetch,
): Promise<TermDetail> {
  if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
    const mockApi = createMockTermsApi();
    return mockApi.getTerm(termId);
  }

  const api = createTermsApi(apiBaseUrl, fetchImplementation);
  return api.getTerm(termId);
}
