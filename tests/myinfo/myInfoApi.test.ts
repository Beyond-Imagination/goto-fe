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

  it('지도용 전체 조회와 커서 페이지 조회는 각자의 경로를 호출한다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      fetchImplementation: stubFetch({ items: [], nextCursor: null }, calls),
    });

    await api.findMyObstacleReports();
    await api.findMyReportPage();
    await api.findMyConfirmedReportPage();

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/obstacle-reports`);
    // 조건이 없으면 쿼리스트링도 붙이지 않는다.
    assert.equal(calls[1].url, `${BASE_URL}/api/v1/members/me/reports`);
    assert.equal(calls[2].url, `${BASE_URL}/api/v1/members/me/obstacle-report-confirmations`);
  });

  it('커서 페이지 조회는 kind·status·cursor·size를 쿼리스트링으로 보낸다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      fetchImplementation: stubFetch({ items: [], nextCursor: null }, calls),
    });

    await api.findMyReportPage({ kind: 'PLACE', cursor: 'T0JTVEFDTEU', size: 20 });
    await api.findMyConfirmedReportPage({ status: 'RESOLVED', cursor: 'Q09ORklSTQ', size: 5 });

    const reportsUrl = new URL(calls[0].url);
    assert.equal(reportsUrl.pathname, '/api/v1/members/me/reports');
    assert.equal(reportsUrl.searchParams.get('kind'), 'PLACE');
    assert.equal(reportsUrl.searchParams.get('cursor'), 'T0JTVEFDTEU');
    assert.equal(reportsUrl.searchParams.get('size'), '20');

    const confirmationsUrl = new URL(calls[1].url);
    assert.equal(confirmationsUrl.pathname, '/api/v1/members/me/obstacle-report-confirmations');
    assert.equal(confirmationsUrl.searchParams.get('status'), 'RESOLVED');
    assert.equal(confirmationsUrl.searchParams.get('cursor'), 'Q09ORklSTQ');
    assert.equal(confirmationsUrl.searchParams.get('size'), '5');
  });

  it('커서가 null이면 첫 페이지 요청이라 cursor 파라미터를 보내지 않는다', async () => {
    const calls: Call[] = [];
    const api = createMyInfoApi({
      apiBaseUrl: BASE_URL,
      fetchImplementation: stubFetch({ items: [], nextCursor: null }, calls),
    });

    await api.findMyReportPage({ cursor: null, size: 10 });

    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.has('cursor'), false);
    assert.equal(url.searchParams.get('size'), '10');
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
