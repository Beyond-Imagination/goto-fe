import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';
import { createMockTermsApi } from '@/mock/adapters/mockTermsApi';
import type { TermDetail, TermsListResponse } from './termsContent';

export type TermsApi = {
  getTerms(): Promise<TermsListResponse>;
  getTerm(termId: string): Promise<TermDetail>;
};

function formatTermsError(error: unknown): Error {
  if (error instanceof ApiError) {
    return new Error(`API request failed with status ${error.status}: ${error.message || 'Error'}`);
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const err = error as { status?: number; message?: string };
    return new Error(`API request failed with status ${err.status || 500}: ${err.message || 'Error'}`);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('API request failed with status 500: Error');
}

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
      } catch (error: unknown) {
        throw formatTermsError(error);
      }
    },
    async getTerm(termId: string) {
      try {
        return await client.get<TermDetail>(`/api/v1/terms/${encodeURIComponent(termId)}`);
      } catch (error: unknown) {
        throw formatTermsError(error);
      }
    },
  };
}

/**
 * 백엔드 활성 약관 목록을 조회합니다. (Mock 모드 시 mockTermsApi 사용)
 */
export async function fetchTermsList(
  // 기본 인자에서 getApiBaseUrl()을 부르면 mock 분기보다 먼저 평가돼 mock 모드에서도 URL 검증이 터집니다.
  apiBaseUrl?: string,
  fetchImplementation?: typeof fetch,
): Promise<readonly TermDetail[]> {
  if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
    const mockApi = createMockTermsApi();
    const response = await mockApi.getTerms();
    return response.terms;
  }

  const api = createTermsApi(apiBaseUrl ?? getApiBaseUrl(), fetchImplementation);
  const response = await api.getTerms();
  return response.terms ?? [];
}

/**
 * 특정 약관 단건 상세 정보를 조회합니다. (Mock 모드 시 mockTermsApi 사용)
 */
export async function fetchTermDetail(
  termId: string,
  apiBaseUrl?: string,
  fetchImplementation?: typeof fetch,
): Promise<TermDetail> {
  if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
    const mockApi = createMockTermsApi();
    return mockApi.getTerm(termId);
  }

  const api = createTermsApi(apiBaseUrl ?? getApiBaseUrl(), fetchImplementation);
  return api.getTerm(termId);
}
