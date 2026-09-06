import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createPlaceApi,
  fetchNearbyAccessibilitySummary,
  searchPlaces,
  type NearbyAccessibilitySummary,
  type PlaceSearchResult,
} from '@/placeApi';
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

describe('placeApi', () => {
  describe('createPlaceApi', () => {
    it('getAccessToken 콜백을 통해 인증 헤더를 설정하고 getNearbySummary를 호출한다', async () => {
      const calls: Call[] = [];
      const mockSummary: NearbyAccessibilitySummary = {
        detourRecommendedCount: 1,
        cautionCount: 2,
        safeCount: 3,
        needsConfirmationCount: 4,
      };
      const fetchImpl = stubFetch(mockSummary, calls);
      const api = createPlaceApi({
        baseUrl: BASE_URL,
        getAccessToken: () => TEST_TOKEN,
        fetchImplementation: fetchImpl,
      });

      const res = await api.getNearbySummary(37.5, 127.0);

      assert.equal(calls.length, 1);
      assert.equal(calls[0]!.authorization, `Bearer ${TEST_TOKEN}`);
      assert.deepEqual(res, mockSummary);
    });

    it('apiBaseUrl 옵션으로 생성 후 searchPlaces를 호출할 수 있다', async () => {
      const calls: Call[] = [];
      const mockResult: PlaceSearchResult = { places: [] };
      const fetchImpl = stubFetch(mockResult, calls);
      const api = createPlaceApi({
        apiBaseUrl: BASE_URL,
        getAccessToken: () => TEST_TOKEN,
        fetchImplementation: fetchImpl,
      });

      const res = await api.searchPlaces(37.5, 127.0, { k: 5 });

      assert.equal(calls.length, 1);
      const parsedUrl = new URL(calls[0]!.url);
      assert.equal(parsedUrl.origin + parsedUrl.pathname, `${BASE_URL}/api/v1/places/search`);
      assert.equal(parsedUrl.searchParams.get('k'), '5');
      assert.deepEqual(res, mockResult);
    });
  });
  describe('fetchNearbyAccessibilitySummary', () => {
    it('요청 위치와 필터 파라미터를 올바르게 직렬화하여 GET 요청을 보낸다', async () => {
      const calls: Call[] = [];
      const mockSummary: NearbyAccessibilitySummary = {
        detourRecommendedCount: 3,
        cautionCount: 7,
        safeCount: 15,
        needsConfirmationCount: 2,
      };

      const fetchImpl = stubFetch(mockSummary, calls);

      const result = await fetchNearbyAccessibilitySummary(
        TEST_TOKEN,
        37.5665,
        126.978,
        {
          mobilityTypes: ['WHEELCHAIR'],
          avoid: ['HIGH_CURB', 'STAIRS'],
        },
        { baseUrl: BASE_URL, fetchImplementation: fetchImpl },
      );

      assert.equal(calls.length, 1);
      const call = calls[0]!;
      assert.equal(call.method, 'GET');
      assert.equal(call.authorization, `Bearer ${TEST_TOKEN}`);

      const parsedUrl = new URL(call.url);
      assert.equal(parsedUrl.origin + parsedUrl.pathname, `${BASE_URL}/api/v1/places/nearby-summary`);
      assert.equal(parsedUrl.searchParams.get('lat'), '37.5665');
      assert.equal(parsedUrl.searchParams.get('lng'), '126.978');
      assert.deepEqual(parsedUrl.searchParams.getAll('mobilityTypes'), ['WHEELCHAIR']);
      assert.deepEqual(parsedUrl.searchParams.getAll('avoid'), ['HIGH_CURB', 'STAIRS']);

      assert.deepEqual(result, mockSummary);
    });

    it('필터 옵션이 없으면 lat, lng만 쿼리 파라미터로 전송한다', async () => {
      const calls: Call[] = [];
      const mockSummary: NearbyAccessibilitySummary = {
        detourRecommendedCount: 0,
        cautionCount: 0,
        safeCount: 0,
        needsConfirmationCount: 0,
      };

      const fetchImpl = stubFetch(mockSummary, calls);

      await fetchNearbyAccessibilitySummary(TEST_TOKEN, 35.829, 129.228, {}, {
        baseUrl: BASE_URL,
        fetchImplementation: fetchImpl,
      });

      assert.equal(calls.length, 1);
      const parsedUrl = new URL(calls[0]!.url);
      assert.equal(parsedUrl.searchParams.get('lat'), '35.829');
      assert.equal(parsedUrl.searchParams.get('lng'), '129.228');
      assert.equal(parsedUrl.searchParams.has('mobilityTypes'), false);
      assert.equal(parsedUrl.searchParams.has('avoid'), false);
    });
  });

  describe('searchPlaces', () => {
    it('k, categoryPrefixes, mobilityTypes, avoid 옵션을 올바르게 직렬화한다', async () => {
      const calls: Call[] = [];
      const mockResult: PlaceSearchResult = {
        places: [
          {
            placeId: 101,
            name: '국립경주박물관',
            categoryCode: 'A01010100',
            address: '경북 경주시 일정로 186',
            thumbnailUrl: 'https://example.com/museum.jpg',
            latitude: 35.8294,
            longitude: 129.2286,
            distanceMeters: 250.5,
            hasIndoorMap: true,
          },
        ],
      };

      const fetchImpl = stubFetch(mockResult, calls);

      const result = await searchPlaces(
        TEST_TOKEN,
        35.8294,
        129.2286,
        {
          k: 20,
          categoryPrefixes: ['A01', 'A02'],
          mobilityTypes: ['WHEELCHAIR', 'STROLLER'],
          avoid: ['STEEP_SLOPE'],
        },
        { baseUrl: BASE_URL, fetchImplementation: fetchImpl },
      );

      assert.equal(calls.length, 1);
      const call = calls[0]!;
      assert.equal(call.method, 'GET');
      assert.equal(call.authorization, `Bearer ${TEST_TOKEN}`);

      const parsedUrl = new URL(call.url);
      assert.equal(parsedUrl.origin + parsedUrl.pathname, `${BASE_URL}/api/v1/places/search`);
      assert.equal(parsedUrl.searchParams.get('lat'), '35.8294');
      assert.equal(parsedUrl.searchParams.get('lng'), '129.2286');
      assert.equal(parsedUrl.searchParams.get('k'), '20');
      assert.deepEqual(parsedUrl.searchParams.getAll('categoryPrefixes'), ['A01', 'A02']);
      assert.deepEqual(parsedUrl.searchParams.getAll('mobilityTypes'), ['WHEELCHAIR', 'STROLLER']);
      assert.deepEqual(parsedUrl.searchParams.getAll('avoid'), ['STEEP_SLOPE']);

      assert.deepEqual(result, mockResult);
    });

    it('서버가 401 오류를 반환하면 ApiError를 던진다', async () => {
      const failingFetch = (async () =>
        new Response(JSON.stringify({ errorCode: 'UNAUTHORIZED', errorMessage: '인증이 필요합니다.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })) as typeof fetch;

      await assert.rejects(
        async () => {
          await searchPlaces(TEST_TOKEN, 37.5, 127.0, {}, {
            baseUrl: BASE_URL,
            fetchImplementation: failingFetch,
          });
        },
        (error: unknown) => {
          return error instanceof ApiError && error.status === 401;
        },
      );
    });
  });
});
