import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApiError } from '@/api';
import { createSavedPlaceApi, SavedPlaceApiError } from '@/saved/savedPlaceApi';

type Call = Readonly<{
  url: string;
  method: string;
  authorization: string | null;
  contentType: string | null;
  body: string | null;
}>;

type StubResponse = Readonly<{ status: number; payload?: unknown }>;

function stubFetch(responses: readonly StubResponse[], calls: Call[]): typeof fetch {
  let index = 0;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('Authorization'),
      contentType: request.headers.get('Content-Type'),
      body: init?.body ? String(init.body) : null,
    });

    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;

    if (next.status === 204) {
      return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify(next.payload ?? {}), {
      status: next.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

const SAVED_PLACE = {
  placeId: 4102,
  name: '국립중앙박물관',
  category: '박물관',
  address: '서울 용산구 서빙고로 137',
  thumbnailUrl: null,
  latitude: 37.52385,
  longitude: 126.98047,
  hasIndoorMap: true,
  isAvailable: true,
  savedAt: '2026-09-02T02:10:00Z',
  notificationEnabled: true,
  latestAccessStatus: 'ACCESSIBLE',
  latestReportedAt: '2026-09-05T05:30:00Z',
};

function createApi(responses: readonly StubResponse[], calls: Call[]) {
  return createSavedPlaceApi({
    apiBaseUrl: BASE_URL,
    getAccessToken: () => 'test-token',
    fetchImplementation: stubFetch(responses, calls),
  });
}

describe('savedPlaceApi', () => {
  it('저장 목록은 GET /api/v1/saved-places/me 를 호출하고 Bearer 토큰을 붙인다', async () => {
    const calls: Call[] = [];
    const api = createApi([{ status: 200, payload: [SAVED_PLACE] }], calls);

    const places = await api.findMine();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE_URL}/api/v1/saved-places/me`);
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.equal(places.length, 1);
    assert.equal(places[0].placeId, 4102);
    assert.equal(places[0].notificationEnabled, true);
    assert.equal(places[0].latestAccessStatus, 'ACCESSIBLE');
  });

  it('저장은 장소 하위 경로에 POST하고 204 응답을 값 없이 끝낸다', async () => {
    const calls: Call[] = [];
    const api = createApi([{ status: 204 }], calls);

    await api.save(4102);

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/places/4102/save`);
    assert.equal(calls[0].method, 'POST');
    // 본문이 없는 저장 요청이라 Content-Type을 붙이지 않습니다.
    assert.equal(calls[0].body, null);
  });

  it('저장 해제는 같은 경로에 DELETE한다', async () => {
    const calls: Call[] = [];
    const api = createApi([{ status: 204 }], calls);

    await api.unsave(4102);

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/places/4102/save`);
    assert.equal(calls[0].method, 'DELETE');
  });

  it('알림 on/off는 PATCH로 enabled만 보내고 갱신된 항목을 돌려준다', async () => {
    const calls: Call[] = [];
    const api = createApi(
      [
        {
          status: 200,
          payload: { ...SAVED_PLACE, notificationEnabled: false },
        },
      ],
      calls,
    );

    const updated = await api.updateNotification(4102, false);

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/saved-places/4102/notification`);
    assert.equal(calls[0].method, 'PATCH');
    assert.equal(calls[0].contentType, 'application/json');
    assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { enabled: false });
    assert.equal(updated.notificationEnabled, false);
  });

  it('저장하지 않은 장소의 알림을 바꾸면 errorCode를 담은 SavedPlaceApiError가 된다', async () => {
    const calls: Call[] = [];
    const api = createApi(
      [
        {
          status: 404,
          payload: {
            errorCode: 'SAVED_PLACE_NOT_FOUND',
            errorMessage: '저장하지 않은 장소입니다.',
          },
        },
      ],
      calls,
    );

    await assert.rejects(
      () => api.updateNotification(4102, false),
      (error: unknown) => {
        assert.ok(error instanceof SavedPlaceApiError);
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 404);
        assert.equal(error.errorCode, 'SAVED_PLACE_NOT_FOUND');
        assert.equal(error.message, '저장하지 않은 장소입니다.');
        return true;
      },
    );
  });

  it('목록 조회 실패도 SavedPlaceApiError로 감싼다', async () => {
    const calls: Call[] = [];
    const api = createApi([{ status: 500, payload: { errorMessage: '서버 오류' } }], calls);

    await assert.rejects(
      () => api.findMine(),
      (error: unknown) => {
        assert.ok(error instanceof SavedPlaceApiError);
        assert.equal(error.status, 500);
        return true;
      },
    );
  });
});
