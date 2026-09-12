import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { createDeviceTokenApi, DeviceTokenApiError } from '@/push/deviceTokenApi';
import {
  createMockDeviceTokenApi,
  mockRegisteredDeviceTokens,
  resetMockDeviceTokenStore,
} from '@/push/mockDeviceTokenApi';

type Call = Readonly<{ url: string; method: string; authorization: string | null; body: string | null }>;

function stubFetch(status: number, calls: Call[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('Authorization'),
      body: init?.body ? String(init.body) : null,
    });

    if (status === 204) {
      return new Response(null, { status: 204 });
    }

    return new Response(
      JSON.stringify({ errorCode: 'INVALID_REQUEST', errorMessage: '잘못된 요청입니다.' }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

function createApi(status: number, calls: Call[]) {
  return createDeviceTokenApi({
    apiBaseUrl: BASE_URL,
    getAccessToken: () => 'test-token',
    fetchImplementation: stubFetch(status, calls),
  });
}

describe('deviceTokenApi', () => {
  it('등록은 POST로 토큰과 플랫폼을 보낸다', async () => {
    const calls: Call[] = [];

    await createApi(204, calls).register({ token: 'fcm-1', platform: 'ANDROID', appVersion: '0.1.0' });

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/device-tokens`);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), {
      token: 'fcm-1',
      platform: 'ANDROID',
      appVersion: '0.1.0',
    });
  });

  it('위치를 함께 보내면 본문에 담긴다', async () => {
    const calls: Call[] = [];

    await createApi(204, calls).register({
      token: 'fcm-1',
      platform: 'IOS',
      latitude: 37.5665,
      longitude: 126.978,
    });

    assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), {
      token: 'fcm-1',
      platform: 'IOS',
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it('위치 갱신은 PATCH /location 을 호출한다', async () => {
    const calls: Call[] = [];

    await createApi(204, calls).updateLocation('fcm-1', 35.8348, 129.2249);

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/device-tokens/location`);
    assert.equal(calls[0].method, 'PATCH');
    assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), {
      token: 'fcm-1',
      latitude: 35.8348,
      longitude: 129.2249,
    });
  });

  it('해제는 DELETE에 토큰을 쿼리로 붙이고 URL 인코딩한다', async () => {
    const calls: Call[] = [];

    await createApi(204, calls).unregister('fcm/token+1');

    assert.equal(calls[0].method, 'DELETE');
    assert.equal(
      calls[0].url,
      `${BASE_URL}/api/v1/members/me/device-tokens?token=${encodeURIComponent('fcm/token+1')}`,
    );
  });

  it('실패는 DeviceTokenApiError로 감싼다', async () => {
    const calls: Call[] = [];

    await assert.rejects(
      () => createApi(400, calls).register({ token: '', platform: 'ANDROID' }),
      (error: unknown) => {
        assert.ok(error instanceof DeviceTokenApiError);
        assert.equal(error.status, 400);
        assert.equal(error.errorCode, 'INVALID_REQUEST');
        return true;
      },
    );
  });
});

describe('mockDeviceTokenApi', () => {
  beforeEach(() => {
    resetMockDeviceTokenStore();
  });

  it('같은 토큰을 다시 등록해도 하나만 남는다 — 실서버와 같은 멱등성', async () => {
    const api = createMockDeviceTokenApi();

    await api.register({ token: 'fcm-1', platform: 'ANDROID' });
    await api.register({ token: 'fcm-1', platform: 'ANDROID' });

    assert.equal(mockRegisteredDeviceTokens().length, 1);
  });

  it('기기마다 따로 저장된다', async () => {
    const api = createMockDeviceTokenApi();

    await api.register({ token: 'fcm-phone', platform: 'ANDROID' });
    await api.register({ token: 'fcm-tablet', platform: 'IOS' });

    assert.deepEqual(
      mockRegisteredDeviceTokens().map(record => record.token),
      ['fcm-phone', 'fcm-tablet'],
    );
  });

  it('위치 갱신은 해당 토큰만 바꾼다', async () => {
    const api = createMockDeviceTokenApi();
    await api.register({ token: 'fcm-1', platform: 'ANDROID' });
    await api.register({ token: 'fcm-2', platform: 'ANDROID' });

    await api.updateLocation('fcm-1', 37.5, 127);

    const [first, second] = mockRegisteredDeviceTokens();
    assert.equal(first.latitude, 37.5);
    assert.equal(second.latitude, undefined);
  });

  it('해제하면 저장소에서 사라진다', async () => {
    const api = createMockDeviceTokenApi();
    await api.register({ token: 'fcm-1', platform: 'ANDROID' });

    await api.unregister('fcm-1');

    assert.equal(mockRegisteredDeviceTokens().length, 0);
  });
});
