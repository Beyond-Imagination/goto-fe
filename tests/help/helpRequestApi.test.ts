import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHelpRequestApi,
  HelpRequestApiError,
  type CreateHelpRequestRequest,
} from '@/help/helpRequestApi';

test('createHelpRequestApi.countPending()은 백엔드 대기 건수 계약을 정상 호출한다', async () => {
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedHeaders: Record<string, string> = {};

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method ?? 'GET';
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};

    return new Response(JSON.stringify({ pendingCount: 5 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    getAccessToken: () => 'sample-jwt-token',
    fetchImplementation: customFetch,
  });

  const response = await api.countPending();

  assert.deepEqual(response, { pendingCount: 5 });
  assert.equal(capturedUrl, 'https://api.goto.test/api/v1/help-requests/pending-count');
  assert.equal(capturedMethod, 'GET');
  assert.equal(capturedHeaders.Accept, 'application/json');
  assert.equal(capturedHeaders.Authorization, 'Bearer sample-jwt-token');
});

test('createHelpRequestApi.create()는 POST /api/v1/help-requests로 올바른 payload를 전송한다', async () => {
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody = '';

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method ?? 'GET';
    capturedBody = String(init?.body);

    return new Response(
      JSON.stringify({
        id: 'req-123',
        status: 'REQUESTED',
        placeId: 10,
        placeName: '경주박물관',
        locationLabel: '정문 앞',
        latitude: 35.8294,
        longitude: 129.2286,
        floorLevel: 1,
        message: '도움이 필요합니다.',
        requesterNickname: 'user1',
        helperNickname: null,
        requestedAt: '2026-08-28T09:00:00Z',
        expiresAt: '2026-08-28T09:30:00Z',
        acceptedAt: null,
        completedAt: null,
        canceledAt: null,
        shareMessage: '현재 정문 앞 1층 근처에서 이동 도움이 필요합니다.',
        emergencyCallRecommended: false,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  const requestPayload: CreateHelpRequestRequest = {
    placeId: 10,
    locationLabel: '정문 앞',
    latitude: 35.8294,
    longitude: 129.2286,
    floorLevel: 1,
    message: '도움이 필요합니다.',
    expiresInMinutes: 30,
  };

  const result = await api.create(requestPayload);

  assert.equal(result.id, 'req-123');
  assert.equal(result.status, 'REQUESTED');
  assert.equal(capturedUrl, 'https://api.goto.test/api/v1/help-requests');
  assert.equal(capturedMethod, 'POST');
  assert.deepEqual(JSON.parse(capturedBody), requestPayload);
});

test('createHelpRequestApi.findPlaceContacts()는 쿼리스트링을 포함하여 GET 요청을 보낸다', async () => {
  let capturedUrl = '';

  const customFetch: typeof fetch = async (input: RequestInfo | URL) => {
    capturedUrl = String(input);
    return new Response(
      JSON.stringify({
        emergencyContact: {
          type: 'EMERGENCY',
          label: '119 긴급신고',
          telephone: '119',
          source: 'SYSTEM',
        },
        placeContacts: [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  await api.findPlaceContacts({
    placeId: 42,
    latitude: 35.8294,
    longitude: 129.2286,
    radiusMeters: 200,
    limit: 5,
  });

  assert.ok(
    capturedUrl.startsWith('https://api.goto.test/api/v1/help-requests/place-contacts?'),
  );
  assert.ok(capturedUrl.includes('placeId=42'));
  assert.ok(capturedUrl.includes('latitude=35.8294'));
  assert.ok(capturedUrl.includes('longitude=129.2286'));
  assert.ok(capturedUrl.includes('radiusMeters=200'));
  assert.ok(capturedUrl.includes('limit=5'));
});

test('createHelpRequestApi.findNearby()는 주변 요청 목록을 조회한다', async () => {
  let capturedUrl = '';

  const customFetch: typeof fetch = async (input: RequestInfo | URL) => {
    capturedUrl = String(input);
    return new Response(
      JSON.stringify([
        {
          id: 'req-456',
          placeId: 1,
          placeName: '박물관',
          locationLabel: '로비',
          message: '안내 부탁드립니다',
          distanceMeters: 50,
          requestedAt: '2026-08-28T09:00:00Z',
          expiresAt: '2026-08-28T09:30:00Z',
        },
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  const list = await api.findNearby({
    latitude: 35.8294,
    longitude: 129.2286,
    radiusMeters: 1000,
  });

  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'req-456');
  assert.ok(capturedUrl.includes('latitude=35.8294'));
  assert.ok(capturedUrl.includes('longitude=129.2286'));
});

test('createHelpRequestApi.reject()는 204 No Content를 정상 처리한다', async () => {
  let capturedUrl = '';
  let capturedMethod = '';

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method ?? 'GET';
    return new Response(null, { status: 204 });
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  await api.reject('uuid-req-999');

  assert.equal(capturedUrl, 'https://api.goto.test/api/v1/help-requests/uuid-req-999/reject');
  assert.equal(capturedMethod, 'POST');
});

test('createHelpRequestApi는 에러 발생 시 HelpRequestApiError를 던진다', async () => {
  const customFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({ errorCode: 'HELP_REQUEST_NOT_FOUND', errorMessage: '도움 요청을 찾을 수 없습니다.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const api = createHelpRequestApi({
    apiBaseUrl: 'https://api.goto.test',
    fetchImplementation: customFetch,
  });

  await assert.rejects(
    () => api.get('invalid-id'),
    (err: unknown) => {
      assert.ok(err instanceof HelpRequestApiError);
      assert.equal(err.status, 404);
      assert.equal(err.errorCode, 'HELP_REQUEST_NOT_FOUND');
      assert.equal(err.message, '도움 요청을 찾을 수 없습니다.');
      return true;
    },
  );
});
