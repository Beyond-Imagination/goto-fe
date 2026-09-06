import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createObstacleReportApi,
  fetchObstacleClusters,
  type ObstacleReportCluster,
} from '@/obstacleReportApi';
import { ApiError } from '@/api';

type Call = Readonly<{ url: string; method: string; authorization: string | null }>;

function stubFetch(payload: unknown, calls: Call[], status = 200): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('Authorization'),
    });

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';
const TEST_TOKEN = 'test-access-token';

describe('obstacleReportApi', () => {
  describe('createObstacleReportApi', () => {
    it('getAccessToken 콜백을 통해 인증 헤더를 설정하고 getClusters를 호출한다', async () => {
      const calls: Call[] = [];
      const fetchImpl = stubFetch([], calls);
      const api = createObstacleReportApi({
        baseUrl: BASE_URL,
        getAccessToken: () => TEST_TOKEN,
        fetchImplementation: fetchImpl,
      });

      const res = await api.getClusters(
        { minLat: 37.0, minLng: 126.0, maxLat: 38.0, maxLng: 127.0 },
        14,
      );

      assert.equal(calls.length, 1);
      assert.equal(calls[0]!.authorization, `Bearer ${TEST_TOKEN}`);
      const parsedUrl = new URL(calls[0]!.url);
      assert.equal(
        parsedUrl.origin + parsedUrl.pathname,
        `${BASE_URL}/api/v1/obstacle-reports/clusters`,
      );
      assert.deepEqual(res, []);
    });
  });
  describe('fetchObstacleClusters', () => {
    it('bbox, zoom, 필터 파라미터를 올바르게 직렬화하여 GET 요청을 보낸다', async () => {
      const calls: Call[] = [];
      const mockClusters: ObstacleReportCluster[] = [
        {
          centerLat: 37.5665,
          centerLng: 126.978,
          reportCount: 5,
          maxSeverity: 'CAUTION',
          topIssueTypes: [{ issueType: 'HIGH_CURB', count: 3 }],
          latestReportAt: '2026-08-25T10:00:00Z',
          affectedMobilityTypes: ['WHEELCHAIR'],
          confirmedReportCount: 2,
          resolvedReportCount: 0,
          staleReportCount: 1,
          id: null,
          photoUrls: null,
          nearbyPlaceLabel: '서울시청 인근',
        },
      ];

      const fetchImpl = stubFetch(mockClusters, calls);

      const result = await fetchObstacleClusters(
        TEST_TOKEN,
        {
          minLat: 37.55,
          minLng: 126.96,
          maxLat: 37.58,
          maxLng: 127.0,
        },
        14,
        {
          mobilityTypes: ['WHEELCHAIR', 'STROLLER'],
          avoid: ['HIGH_CURB'],
        },
        { baseUrl: BASE_URL, fetchImplementation: fetchImpl },
      );

      assert.equal(calls.length, 1);
      const call = calls[0]!;
      assert.equal(call.method, 'GET');
      assert.equal(call.authorization, `Bearer ${TEST_TOKEN}`);

      const parsedUrl = new URL(call.url);
      assert.equal(
        parsedUrl.origin + parsedUrl.pathname,
        `${BASE_URL}/api/v1/obstacle-reports/clusters`,
      );
      assert.equal(parsedUrl.searchParams.get('minLat'), '37.55');
      assert.equal(parsedUrl.searchParams.get('minLng'), '126.96');
      assert.equal(parsedUrl.searchParams.get('maxLat'), '37.58');
      assert.equal(parsedUrl.searchParams.get('maxLng'), '127');
      assert.equal(parsedUrl.searchParams.get('zoom'), '14');
      assert.deepEqual(parsedUrl.searchParams.getAll('mobilityTypes'), ['WHEELCHAIR', 'STROLLER']);
      assert.deepEqual(parsedUrl.searchParams.getAll('avoid'), ['HIGH_CURB']);

      assert.deepEqual(result, mockClusters);
    });

    it('필터가 없을 때는 bbox와 zoom만 직렬화한다', async () => {
      const calls: Call[] = [];
      const fetchImpl = stubFetch([], calls);

      await fetchObstacleClusters(
        TEST_TOKEN,
        {
          minLat: 35.8,
          minLng: 129.2,
          maxLat: 35.9,
          maxLng: 129.3,
        },
        12,
        {},
        { baseUrl: BASE_URL, fetchImplementation: fetchImpl },
      );

      assert.equal(calls.length, 1);
      const parsedUrl = new URL(calls[0]!.url);
      assert.equal(parsedUrl.searchParams.get('minLat'), '35.8');
      assert.equal(parsedUrl.searchParams.get('minLng'), '129.2');
      assert.equal(parsedUrl.searchParams.get('maxLat'), '35.9');
      assert.equal(parsedUrl.searchParams.get('maxLng'), '129.3');
      assert.equal(parsedUrl.searchParams.get('zoom'), '12');
      assert.equal(parsedUrl.searchParams.has('mobilityTypes'), false);
      assert.equal(parsedUrl.searchParams.has('avoid'), false);
    });

    it('서버 500 오류 시 ApiError를 던진다', async () => {
      const failingFetch = (async () =>
        new Response(JSON.stringify({ errorCode: 'INTERNAL_ERROR', errorMessage: '서버 에러입니다.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })) as typeof fetch;

      await assert.rejects(
        async () => {
          await fetchObstacleClusters(
            TEST_TOKEN,
            { minLat: 37.0, minLng: 126.0, maxLat: 38.0, maxLng: 127.0 },
            10,
            {},
            { baseUrl: BASE_URL, fetchImplementation: failingFetch },
          );
        },
        (error: unknown) => {
          return error instanceof ApiError && error.status === 500;
        },
      );
    });
  });
});
