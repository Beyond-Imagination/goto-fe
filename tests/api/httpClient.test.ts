import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, createHttpClient } from '@/api';

test('httpClient.get은 쿼리 파라미터를 정상 인코딩하여 전송한다', async () => {
  let capturedUrl = '';
  let capturedHeaders: Record<string, string> = {};

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};

    return new Response(JSON.stringify({ result: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    fetch: customFetch,
  });

  type ResponseType = { result: string };
  type QueryParams = { placeId: number; active: boolean; tags: string[]; empty?: string };

  const data = await client.get<ResponseType, QueryParams>('/places/search', {
    params: {
      placeId: 10,
      active: true,
      tags: ['safe', 'accessible'],
      empty: undefined,
    },
  });

  assert.deepEqual(data, { result: 'ok' });
  assert.ok(capturedUrl.startsWith('https://api.goto.test/places/search?'));
  assert.ok(capturedUrl.includes('placeId=10'));
  assert.ok(capturedUrl.includes('active=true'));
  assert.ok(capturedUrl.includes('tags=safe'));
  assert.ok(capturedUrl.includes('tags=accessible'));
  assert.ok(!capturedUrl.includes('empty'));
  assert.equal(capturedHeaders.Accept, 'application/json');
});

test('httpClient.post는 Request Body를 JSON으로 직렬화하고 토큰 헤더를 주입한다', async () => {
  let capturedMethod = '';
  let capturedBody = '';
  let capturedHeaders: Record<string, string> = {};

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedMethod = init?.method ?? 'GET';
    capturedBody = String(init?.body);
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};

    return new Response(JSON.stringify({ id: 123, name: 'Created' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    getAccessToken: async () => 'mock-jwt-token',
    fetch: customFetch,
  });

  type RequestPayload = { name: string; count: number };
  type ResponsePayload = { id: number; name: string };

  const payload: RequestPayload = { name: 'Test', count: 42 };
  const res = await client.post<ResponsePayload, RequestPayload>('/items', payload);

  assert.deepEqual(res, { id: 123, name: 'Created' });
  assert.equal(capturedMethod, 'POST');
  assert.deepEqual(JSON.parse(capturedBody), payload);
  assert.equal(capturedHeaders.Authorization, 'Bearer mock-jwt-token');
  assert.equal(capturedHeaders['Content-Type'], 'application/json');
});

test('httpClient.delete는 204 No Content를 성공으로 처리한다', async () => {
  const customFetch: typeof fetch = async () => {
    return new Response(null, { status: 204 });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    fetch: customFetch,
  });

  const result = await client.delete('/items/123');
  assert.equal(result, undefined);
});

test('skipAuth: true 일 때는 Authorization 헤더를 포함하지 않는다', async () => {
  let capturedHeaders: Record<string, string> = {};

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    getAccessToken: () => 'sample-token',
    fetch: customFetch,
  });

  await client.get('/public-endpoint', { skipAuth: true });
  assert.equal(capturedHeaders.Authorization, undefined);
});

test('401 응답 시 refreshAccessToken으로 갱신 후 원래 요청을 재시도(Replay)한다', async () => {
  let requestCount = 0;
  let refreshCount = 0;
  let currentToken = 'expired-token';

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestCount += 1;
    const authHeader = (init?.headers as Record<string, string>)?.Authorization;

    if (authHeader === 'Bearer expired-token') {
      return new Response(
        JSON.stringify({ errorCode: 'UNAUTHORIZED', errorMessage: '토큰이 만료되었습니다.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (authHeader === 'Bearer refreshed-token') {
      return new Response(JSON.stringify({ message: 'Success after refresh' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 400 });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    getAccessToken: () => currentToken,
    refreshAccessToken: async () => {
      refreshCount += 1;
      currentToken = 'refreshed-token';
      return 'refreshed-token';
    },
    fetch: customFetch,
  });

  const response = await client.get<{ message: string }>('/protected-data');

  assert.deepEqual(response, { message: 'Success after refresh' });
  assert.equal(refreshCount, 1);
  assert.equal(requestCount, 2); // 1st expired -> 401, 2nd retry with new token -> 200
});

test('동시에 여러 요청이 401을 받아도 토큰 갱신은 단 1회만 실행된다 (Deduplication Mutex)', async () => {
  let refreshCount = 0;
  let currentToken = 'expired-token';

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const authHeader = (init?.headers as Record<string, string>)?.Authorization;

    if (authHeader === 'Bearer expired-token') {
      return new Response(
        JSON.stringify({ errorCode: 'UNAUTHORIZED', errorMessage: '토큰 만료' }),
        { status: 401 },
      );
    }

    return new Response(JSON.stringify({ path: String(input) }), { status: 200 });
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    getAccessToken: () => currentToken,
    refreshAccessToken: async () => {
      refreshCount += 1;
      // 갱신 비동기 딜레이 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 20));
      currentToken = 'refreshed-token';
      return 'refreshed-token';
    },
    fetch: customFetch,
  });

  // 3개 API 동시 요청
  const results = await Promise.all([
    client.get<{ path: string }>('/req-1'),
    client.get<{ path: string }>('/req-2'),
    client.get<{ path: string }>('/req-3'),
  ]);

  assert.equal(refreshCount, 1);
  assert.equal(results.length, 3);
  assert.ok(results[0].path.includes('/req-1'));
  assert.ok(results[1].path.includes('/req-2'));
  assert.ok(results[2].path.includes('/req-3'));
});

test('토큰 갱신마저 실패하면 onSessionExpired를 호출하고 ApiError를 던진다', async () => {
  let sessionExpiredCalled = false;

  const customFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({ errorCode: 'UNAUTHORIZED', errorMessage: '토큰 만료' }),
      { status: 401 },
    );
  };

  const client = createHttpClient({
    baseUrl: 'https://api.goto.test',
    getAccessToken: () => 'expired-token',
    refreshAccessToken: async () => {
      throw new Error('Refresh token is also expired');
    },
    onSessionExpired: () => {
      sessionExpiredCalled = true;
    },
    fetch: customFetch,
  });

  await assert.rejects(
    () => client.get('/protected-resource'),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 401);
      return true;
    },
  );

  assert.equal(sessionExpiredCalled, true);
});
