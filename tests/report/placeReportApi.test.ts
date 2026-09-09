import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPlaceReportApi } from '@/placeReportApi';
import {
  PLACE_ACCESS_STATUS_LABELS,
  PLACE_ACCESS_STATUS_OPTIONS,
  PLACE_FACILITY_OPTIONS,
  PLACE_FACILITY_STATUS_OPTIONS,
  REPORT_KIND_OPTIONS,
} from '@/report/reportOptions';
import { REPORT_KIND } from '@/report/reportModel';

type Call = Readonly<{ url: string; method: string; body: string }>;

function stubFetch(payload: unknown, calls: Call[], status = 200): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({ url: request.url, method: request.method, body: await request.text() });

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

const PLACE_REPORT_PAYLOAD = {
  id: 31,
  placeId: 5012,
  placeName: '서울숲 공원',
  placeAddress: '서울 성동구 뚝섬로 273',
  latitude: 37.544,
  longitude: 127.037,
  accessStatus: 'PARTIALLY_ACCESSIBLE',
  facilityStatuses: { ELEVATOR: 'BROKEN' },
  photoUrls: [],
  description: '정문 경사로는 있지만 문이 무거워요',
  createdAt: '2026-09-08T01:00:00Z',
};

describe('장소 상태 제보 옵션', () => {
  it('BE PlaceAccessStatus 3종을 노출하고 라벨을 갖는다', () => {
    assert.deepEqual(
      PLACE_ACCESS_STATUS_OPTIONS.map(option => option.value),
      ['ACCESSIBLE', 'PARTIALLY_ACCESSIBLE', 'INACCESSIBLE'],
    );
    for (const option of PLACE_ACCESS_STATUS_OPTIONS) {
      assert.equal(PLACE_ACCESS_STATUS_LABELS[option.value], option.label);
    }
  });

  it('편의시설은 BE PriorityFacility 4종, 상태는 3종이다', () => {
    assert.deepEqual(
      PLACE_FACILITY_OPTIONS.map(option => option.value),
      ['ELEVATOR', 'ACCESSIBLE_TOILET', 'RAMP', 'PARKING'],
    );
    assert.deepEqual(
      PLACE_FACILITY_STATUS_OPTIONS.map(option => option.value),
      ['AVAILABLE', 'UNAVAILABLE', 'BROKEN'],
    );
  });

  it('장소 상태 제보가 잠금 없이 열려 있다', () => {
    const placeState = REPORT_KIND_OPTIONS.find(option => option.kind === REPORT_KIND.placeState);

    assert.ok(placeState);
    assert.equal(placeState.disabledReason, undefined);
    assert.equal(placeState.title, '장소 상태');
  });
});

describe('장소 상태 제보 API 연동', () => {
  it('create가 placeId·이용 난이도·편의시설 상태를 그대로 전송한다', async () => {
    const calls: Call[] = [];
    const api = createPlaceReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch(PLACE_REPORT_PAYLOAD, calls, 201),
    });

    const report = await api.create({
      placeId: 5012,
      accessStatus: 'PARTIALLY_ACCESSIBLE',
      facilityStatuses: { ELEVATOR: 'BROKEN' },
      photoUrls: [],
      description: '정문 경사로는 있지만 문이 무거워요',
    });

    assert.equal(calls[0]!.method, 'POST');
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/place-state-reports`);
    assert.deepEqual(JSON.parse(calls[0]!.body), {
      placeId: 5012,
      accessStatus: 'PARTIALLY_ACCESSIBLE',
      facilityStatuses: { ELEVATOR: 'BROKEN' },
      photoUrls: [],
      description: '정문 경사로는 있지만 문이 무거워요',
    });
    assert.equal(report.placeName, '서울숲 공원');
  });

  it('상세·장소별 목록 조회 경로가 BE 스펙과 같다', async () => {
    const calls: Call[] = [];
    const api = createPlaceReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch([PLACE_REPORT_PAYLOAD], calls),
    });

    await api.get(31);
    await api.findByPlace(5012);

    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/place-state-reports/31`);
    assert.equal(calls[1]!.url, `${BASE_URL}/api/v1/places/5012/state-reports`);
  });
});
