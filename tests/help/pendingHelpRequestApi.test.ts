import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMockPendingHelpRequestApi,
  createPendingHelpRequestApi,
  getPendingHelpRequestApi,
  toVisiblePendingCount,
} from '@/help/pendingHelpRequestApi';

test('mock pending 도움 요청 API는 지정한 건수를 비동기로 반환한다', async () => {
  const api = createMockPendingHelpRequestApi(2);

  assert.equal(await api.getPendingCount(), 2);
});

test('getPendingHelpRequestApi는 mock 모드에서는 mock 어댑터를, live 모드에서는 live 어댑터를 반환한다', () => {
  const mockApi = getPendingHelpRequestApi('mock');
  assert.ok(mockApi);

  const liveApi = getPendingHelpRequestApi('live', {
    apiBaseUrl: 'https://api.goto.test',
  });
  assert.ok(liveApi);
});

test('createPendingHelpRequestApi는 GET /api/v1/help-requests/pending-count 엔드포인트로 요청을 보낸다', async () => {
  let requestedUrl = '';
  let requestedHeaders: Record<string, string> = {};

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedHeaders = (init?.headers as Record<string, string>) ?? {};

    return new Response(JSON.stringify({ pendingCount: 3 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const api = createPendingHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    getAccessToken: () => 'test-access-token',
    fetchImplementation: customFetch,
  });

  const count = await api.getPendingCount();

  assert.equal(count, 3);
  assert.equal(requestedUrl, 'https://api.goto.test/api/v1/help-requests/pending-count');
  assert.equal(requestedHeaders.Accept, 'application/json');
  assert.equal(requestedHeaders.Authorization, 'Bearer test-access-token');
});

test('createPendingHelpRequestApi는 서버 오류 시 에러를 던진다', async () => {
  const customFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({ errorCode: 'UNAUTHORIZED', errorMessage: '인증이 필요합니다.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  const api = createPendingHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  await assert.rejects(
    () => api.getPendingCount(),
    (err: any) => {
      assert.equal(err.status, 401);
      assert.equal(err.errorCode, 'UNAUTHORIZED');
      assert.equal(err.message, '인증이 필요합니다.');
      return true;
    },
  );
});

test('배지는 양수인 안전한 정수만 표시한다', () => {
  assert.equal(toVisiblePendingCount(2), 2);
  assert.equal(toVisiblePendingCount(0), null);
  assert.equal(toVisiblePendingCount(-1), null);
  assert.equal(toVisiblePendingCount(1.5), null);
});
