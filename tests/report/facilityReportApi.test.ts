import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createFacilityReportApi } from '@/facilityReportApi';
import {
  FACILITY_ISSUE_TYPE_LABELS,
  FACILITY_ISSUE_TYPE_OPTIONS,
  FACILITY_NODE_TYPE_LABELS,
  REPORT_KIND_OPTIONS,
  formatFloorLevel,
} from '@/report/reportOptions';
import { REPORT_KIND } from '@/report/reportModel';

type Call = Readonly<{ url: string; method: string; body: string; authorization: string | null }>;

function stubFetch(payload: unknown, calls: Call[], status = 200): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      body: await request.text(),
      authorization: request.headers.get('Authorization'),
    });

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

const FACILITY_REPORT_PAYLOAD = {
  id: 77,
  nodeId: 9001,
  nodeType: 'ELEVATOR',
  nodeName: '본관 엘리베이터',
  floorLevel: 2,
  placeId: 5013,
  placeName: '국립경주박물관',
  latitude: 35.8295,
  longitude: 129.2287,
  issueType: 'BROKEN',
  description: '멈춰 있어요',
  createdAt: '2026-09-08T01:00:00Z',
  calibration: {
    confirmedAt: '2026-09-08T01:00:00Z',
    latitude: 35.8295,
    longitude: 129.2287,
    floorLevel: 2,
    snapRadius: 5,
  },
};

describe('시설 상태 제보 옵션', () => {
  it('BE FacilityIssueType 7종을 모두 노출하고 라벨을 갖는다', () => {
    assert.deepEqual(
      FACILITY_ISSUE_TYPE_OPTIONS.map(option => option.value),
      ['BROKEN', 'OUT_OF_SERVICE', 'BLOCKED', 'DAMAGED', 'MISSING', 'REPAIRED', 'OTHER'],
    );
    for (const option of FACILITY_ISSUE_TYPE_OPTIONS) {
      assert.equal(FACILITY_ISSUE_TYPE_LABELS[option.value], option.label);
    }
  });

  it('제보 유형 세 가지가 모두 열려 있다', () => {
    const locked = REPORT_KIND_OPTIONS.filter(option => option.disabledReason !== undefined);

    assert.deepEqual(locked, []);
    assert.deepEqual(
      REPORT_KIND_OPTIONS.map(option => option.kind),
      [REPORT_KIND.placeState, REPORT_KIND.facilityState, REPORT_KIND.obstacle],
    );
  });

  it('모르는 시설 유형은 원문을 그대로 쓸 수 있게 라벨 맵이 부분 매핑이다', () => {
    assert.equal(FACILITY_NODE_TYPE_LABELS.ELEVATOR, '엘리베이터');
    assert.equal(FACILITY_NODE_TYPE_LABELS.SOMETHING_NEW, undefined);
  });
});

describe('formatFloorLevel', () => {
  it('지상·지하·없음을 각각 사람이 읽는 표기로 바꾼다', () => {
    assert.equal(formatFloorLevel(2), '2층');
    assert.equal(formatFloorLevel(-1), '지하 1층');
    assert.equal(formatFloorLevel(-3), '지하 3층');
    assert.equal(formatFloorLevel(0), '0층');
    assert.equal(formatFloorLevel(null), '층 정보 없음');
    assert.equal(formatFloorLevel(undefined), '층 정보 없음');
  });
});

describe('시설 상태 제보 API 연동', () => {
  it('create가 nodeId·issueType·메모를 그대로 전송하고 인증 헤더를 붙인다', async () => {
    const calls: Call[] = [];
    const api = createFacilityReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch(FACILITY_REPORT_PAYLOAD, calls, 201),
    });

    const report = await api.create({
      nodeId: 9001,
      issueType: 'BROKEN',
      description: '멈춰 있어요',
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.method, 'POST');
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/reports`);
    assert.equal(calls[0]!.authorization, 'Bearer token');
    assert.deepEqual(JSON.parse(calls[0]!.body), {
      nodeId: 9001,
      issueType: 'BROKEN',
      description: '멈춰 있어요',
    });
    // 체크포인트 시설이면 위치 보정 정보가 함께 온다.
    assert.equal(report.calibration?.snapRadius, 5);
  });

  it('상세 조회 경로가 BE 스펙과 같다', async () => {
    const calls: Call[] = [];
    const api = createFacilityReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch(FACILITY_REPORT_PAYLOAD, calls),
    });

    await api.get(77);

    assert.equal(calls[0]!.method, 'GET');
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/reports/77`);
  });

  it('서버 오류는 그대로 던져 화면이 실패를 표시할 수 있게 한다', async () => {
    const calls: Call[] = [];
    const api = createFacilityReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch({ message: '시설 상태 제보를 찾을 수 없습니다.' }, calls, 404),
    });

    await assert.rejects(() => api.get(9999));
  });
});
