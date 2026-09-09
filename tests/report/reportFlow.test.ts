import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createObstacleReportApi } from '@/obstacleReportApi';
// 화면·네이티브 모듈에 의존하지 않는 순수 모듈만 직접 가져옵니다 (배럴은 React를 끌어옵니다).
import { MAX_PHOTOS, REPORT_KIND, toggleInList } from '@/report/reportModel';
import {
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_OPTIONS,
  REPORT_KIND_OPTIONS,
  SEVERITY_OPTIONS,
} from '@/report/reportOptions';

type Call = Readonly<{
  url: string;
  method: string;
  contentType: string | null;
  body: string;
}>;

function stubFetch(payload: unknown, calls: Call[], status = 200): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      contentType: request.headers.get('Content-Type'),
      body: await request.text(),
    });

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

const REPORT_PAYLOAD = {
  id: 7,
  lat: 37.5,
  lng: 127.0,
  issueType: 'OBSTRUCTION',
  severity: 'CAUTION',
  affectedMobilityTypes: ['WHEELCHAIR'],
  photoUrls: ['https://cdn.example.test/a.jpg'],
  description: null,
  status: 'ACTIVE',
  stale: false,
  confirmedCount: 0,
  createdAt: '2026-09-08T01:00:00Z',
  lastConfirmedAt: null,
};

describe('제보 옵션', () => {
  it('BE ObstacleIssueType 12종을 모두 노출하고 라벨을 갖는다', () => {
    assert.equal(ISSUE_TYPE_OPTIONS.length, 12);
    for (const option of ISSUE_TYPE_OPTIONS) {
      assert.equal(ISSUE_TYPE_LABELS[option.value], option.label);
    }
  });

  it('새로 추가된 유형(적치물·불법주차·점자블록·미끄러움·기타)이 포함된다', () => {
    const values = ISSUE_TYPE_OPTIONS.map(option => option.value);
    for (const added of [
      'OBSTRUCTION',
      'ILLEGAL_PARKING',
      'BRAILLE_BLOCK_DAMAGE',
      'SLIPPERY_SURFACE',
      'OTHER',
    ] as const) {
      assert.ok(values.includes(added), `${added}가 없습니다`);
    }
  });

  it('세 가지 제보 유형이 모두 BE 연동되어 잠긴 유형이 없다', () => {
    assert.deepEqual(
      REPORT_KIND_OPTIONS.filter(option => option.disabledReason !== undefined),
      [],
    );
    assert.deepEqual(
      REPORT_KIND_OPTIONS.map(option => option.kind).sort(),
      [REPORT_KIND.facilityState, REPORT_KIND.obstacle, REPORT_KIND.placeState].sort(),
    );
  });

  it('통행상태는 BE ObstacleSeverity 3종만 쓴다', () => {
    assert.deepEqual(
      SEVERITY_OPTIONS.map(option => option.value),
      ['INFO', 'CAUTION', 'IMPASSABLE'],
    );
  });

  it('사진은 최대 3장까지 첨부한다', () => {
    assert.equal(MAX_PHOTOS, 3);
  });
});

describe('toggleInList', () => {
  it('없으면 추가하고 있으면 제거한다', () => {
    assert.deepEqual(toggleInList<string>([], 'a'), ['a']);
    assert.deepEqual(toggleInList(['a', 'b'], 'a'), ['b']);
  });
});

describe('제보 등록 API 연동', () => {
  it('create가 좌표·유형·심각도·영향 대상·메모를 그대로 전송한다', async () => {
    const calls: Call[] = [];
    const api = createObstacleReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch(REPORT_PAYLOAD, calls, 201),
    });

    const report = await api.create({
      lat: 37.5,
      lng: 127.0,
      issueType: 'OBSTRUCTION',
      severity: 'CAUTION',
      affectedMobilityTypes: ['WHEELCHAIR'],
      photoUrls: ['https://cdn.example.test/a.jpg'],
      description: '보도에 자재가 쌓여 있어요',
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.method, 'POST');
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/obstacle-reports`);
    assert.deepEqual(JSON.parse(calls[0]!.body), {
      lat: 37.5,
      lng: 127.0,
      issueType: 'OBSTRUCTION',
      severity: 'CAUTION',
      affectedMobilityTypes: ['WHEELCHAIR'],
      photoUrls: ['https://cdn.example.test/a.jpg'],
      description: '보도에 자재가 쌓여 있어요',
    });
    assert.equal(report.id, 7);
  });

  it('uploadImage는 multipart로 보내고 응답 url만 돌려준다', async () => {
    const calls: Call[] = [];
    const api = createObstacleReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch({ url: 'https://cdn.example.test/a.jpg' }, calls, 201),
    });

    const url = await api.uploadImage({
      uri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
      fileName: 'a.jpg',
    });

    assert.equal(url, 'https://cdn.example.test/a.jpg');
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/uploads/images`);
    // JSON 직렬화를 우회해 FormData가 그대로 실려야 합니다.
    assert.ok((calls[0]!.contentType ?? '').startsWith('multipart/form-data'));
  });

  it('updateStatus가 「아직 있어요」·「해결됐어요」를 action으로 보낸다', async () => {
    const calls: Call[] = [];
    const api = createObstacleReportApi({
      baseUrl: BASE_URL,
      getAccessToken: () => 'token',
      fetchImplementation: stubFetch({ ...REPORT_PAYLOAD, status: 'RESOLVED' }, calls),
    });

    await api.updateStatus(7, 'STILL_PRESENT');
    await api.updateStatus(7, 'RESOLVED');

    assert.deepEqual(
      calls.map(call => JSON.parse(call.body)),
      [{ action: 'STILL_PRESENT' }, { action: 'RESOLVED' }],
    );
    assert.equal(calls[0]!.url, `${BASE_URL}/api/v1/obstacle-reports/7/status`);
  });
});
