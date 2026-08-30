import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMyInfoApi } from '../../src/myinfo/myInfoApi';

type Call = Readonly<{ url: string; method: string; authorization: string | null; body: string | null }>;

function stubFetch(payload: unknown, calls: Call[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('Authorization'),
      body: init?.body ? String(init.body) : null,
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

describe('myInfoApi', () => {
  it('내 프로필은 GET /api/v1/members/me 를 호출하고 Bearer 토큰을 붙인다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      getAccessToken: () => 'test-token',
      fetchImplementation: stubFetch(
        {
          nickname: '경주여행자',
          mobilityModes: ['WHEELCHAIR'],
          stats: { reportCount: 2, helpedPeopleCount: 8, resolvedConfirmationCount: 1 },
        },
        calls,
      ),
    });

    const profile = await api.getProfile();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me`);
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.equal(profile.nickname, '경주여행자');
    assert.equal(profile.stats.helpedPeopleCount, 8);
  });

  it('접근성 프로필 수정은 PUT으로 전달한 값을 그대로 본문에 담는다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      getAccessToken: () => 'test-token',
      fetchImplementation: stubFetch(
        { mobilityModes: ['STROLLER'], priorityFacilities: ['RAMP'], avoidConditions: [] },
        calls,
      ),
    });

    await api.updatePreferences({
      mobilityModes: ['STROLLER'],
      priorityFacilities: ['RAMP'],
      avoidConditions: [],
    });

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/preferences`);
    assert.equal(calls[0].method, 'PUT');
    assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), {
      mobilityModes: ['STROLLER'],
      priorityFacilities: ['RAMP'],
      avoidConditions: [],
    });
  });

  it('내 제보 목록과 확인 목록은 각자의 경로를 호출한다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      fetchImplementation: stubFetch([], calls),
    });

    await api.findMyReports();
    await api.findMyConfirmedReports();

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/obstacle-reports`);
    assert.equal(calls[1].url, `${BASE_URL}/api/v1/members/me/obstacle-report-confirmations`);
  });

  it('실패 응답은 MyInfoApiError로 감싸 상태 코드를 유지한다', async () => {
    const failing = (async () =>
      new Response(JSON.stringify({ errorCode: 'MEMBER_NOT_FOUND', errorMessage: '사용자를 찾을 수 없습니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    const api = createMyInfoApi({ apiBaseUrl: BASE_URL, fetchImplementation: failing });

    await assert.rejects(
      () => api.getProfile(),
      (error: unknown) => {
        assert.equal((error as { name: string }).name, 'MyInfoApiError');
        assert.equal((error as { status: number }).status, 401);
        return true;
      },
    );
  });
});
