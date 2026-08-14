import assert from 'node:assert/strict';
import test from 'node:test';

import type { TermDetail, TermsListResponse } from '@/auth/signup/termsContent';
import {
  createTermsApi,
  fetchTermDetail,
  fetchTermsList,
} from '@/auth/signup/termsApi';

const MOCK_API_BASE_URL = 'https://api.goto.local';

const sampleTermsResponse: TermsListResponse = {
  terms: [
    {
      id: 'terms',
      bit: 2,
      title: '서비스 이용약관',
      required: true,
      version: '1.0.0',
      effectiveDate: '2026-08-01',
      summary: 'Beyond-Imagination 개발 동아리 약관입니다.',
      sections: [
        {
          title: '제 1 조 (목적)',
          content: '본 약관은 서비스 이용조건을 규정합니다.',
        },
      ],
      createdAt: '2026-08-14T19:00:00Z',
      updatedAt: '2026-08-14T20:00:00Z',
    },
  ],
};

test('createTermsApi.getTerms()는 /api/v1/terms 엔드포인트로 GET 요청을 보낸다', async () => {
  let requestedUrl = '';

  const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
    requestedUrl = String(input);
    return new Response(JSON.stringify(sampleTermsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const api = createTermsApi(MOCK_API_BASE_URL, mockFetch);
  const result = await api.getTerms();

  assert.strictEqual(requestedUrl, `${MOCK_API_BASE_URL}/api/v1/terms`);
  assert.strictEqual(result.terms.length, 1);
  assert.strictEqual(result.terms[0]?.id, 'terms');
  assert.strictEqual(result.terms[0]?.title, '서비스 이용약관');
});

test('createTermsApi.getTerm(termId)는 /api/v1/terms/{termId} 엔드포인트로 GET 요청을 보낸다', async () => {
  let requestedUrl = '';
  const singleTerm: TermDetail = sampleTermsResponse.terms[0]!;

  const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
    requestedUrl = String(input);
    return new Response(JSON.stringify(singleTerm), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const api = createTermsApi(MOCK_API_BASE_URL, mockFetch);
  const result = await api.getTerm('terms');

  assert.strictEqual(requestedUrl, `${MOCK_API_BASE_URL}/api/v1/terms/terms`);
  assert.strictEqual(result.id, 'terms');
  assert.strictEqual(result.title, '서비스 이용약관');
});

test('fetchTermsList는 서버 응답 성공 시 약관 목록 배열을 반환한다', async () => {
  const mockFetch = async (): Promise<Response> => {
    return new Response(JSON.stringify(sampleTermsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const terms = await fetchTermsList(MOCK_API_BASE_URL, mockFetch);

  assert.strictEqual(terms.length, 1);
  assert.strictEqual(terms[0]?.id, 'terms');
  assert.strictEqual(terms[0]?.version, '1.0.0');
});

test('fetchTermsList는 서버 오류(500) 시 에러를 던진다', async () => {
  const failingFetch = async (): Promise<Response> => {
    return new Response(JSON.stringify({ errorMessage: 'Internal Server Error' }), {
      status: 500,
      statusText: 'Internal Server Error',
    });
  };

  await assert.rejects(
    async () => {
      await fetchTermsList(MOCK_API_BASE_URL, failingFetch);
    },
    /API request failed with status 500/,
  );
});

test('fetchTermDetail은 단건 조회 404 실패 시 에러를 던진다', async () => {
  const notFoundFetch = async (): Promise<Response> => {
    return new Response(JSON.stringify({ errorMessage: 'Not Found' }), {
      status: 404,
      statusText: 'Not Found',
    });
  };

  await assert.rejects(
    async () => {
      await fetchTermDetail('unknown', MOCK_API_BASE_URL, notFoundFetch);
    },
    /API request failed with status 404/,
  );
});
