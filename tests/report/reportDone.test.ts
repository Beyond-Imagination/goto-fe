import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { FacilityReportResponse } from '@/facilityReportApi';
import type { ObstacleReportResponse } from '@/obstacleReportApi';
import type { PlaceStateReportResponse } from '@/placeReportApi';
import {
  toFacilityDoneSummary,
  toObstacleDoneSummary,
  toPlaceDoneSummary,
} from '@/report/reportDone';

const OBSTACLE: ObstacleReportResponse = {
  id: 7,
  lat: 37.5665,
  lng: 126.978,
  issueType: 'OBSTRUCTION',
  severity: 'CAUTION',
  affectedMobilityTypes: ['WHEELCHAIR'],
  photoUrls: ['https://cdn.example.test/a.jpg'],
  description: '보도에 자재가 쌓여 있어요',
  status: 'ACTIVE',
  stale: false,
  confirmedCount: 0,
  createdAt: '2026-09-08T01:00:00Z',
  lastConfirmedAt: null,
};

const PLACE: PlaceStateReportResponse = {
  id: 31,
  placeId: 5012,
  placeName: '서울숲 공원',
  placeAddress: '서울 성동구 뚝섬로 273',
  latitude: 37.544,
  longitude: 127.037,
  accessStatus: 'PARTIALLY_ACCESSIBLE',
  facilityStatuses: { ELEVATOR: 'BROKEN' },
  photoUrls: [],
  description: null,
  createdAt: '2026-09-08T01:00:00Z',
};

const FACILITY: FacilityReportResponse = {
  id: 77,
  nodeId: 9001,
  nodeType: 'ELEVATOR',
  nodeName: '본관 엘리베이터',
  floorLevel: -1,
  placeId: 5013,
  placeName: '성수동 주민센터',
  latitude: 37.5445,
  longitude: 127.0553,
  issueType: 'BROKEN',
  description: null,
  createdAt: '2026-09-08T01:00:00Z',
  calibration: {
    confirmedAt: '2026-09-08T01:00:00Z',
    latitude: 37.5445,
    longitude: 127.0553,
    floorLevel: -1,
    snapRadius: 5,
  },
};

describe('완료 화면 — 길 위 장애물 (제보 07)', () => {
  it('요약 카드에 유형·심각도와 장소명을 담고 지도에서 보기로 이어진다', () => {
    const summary = toObstacleDoneSummary(OBSTACLE, '서울숲 공원');

    assert.equal(summary.id, 7);
    assert.equal(summary.tagLabel, '주의');
    assert.equal(summary.cards[0]!.title, '적치물 · 주의');
    assert.equal(summary.cards[0]!.body, '서울숲 공원');
    assert.equal(summary.cards[0]!.emphasized, true);
    assert.equal(summary.primaryActionLabel, '지도에서 보기');
    assert.deepEqual(summary.photoUrls, ['https://cdn.example.test/a.jpg']);
  });

  it('장소를 고르지 않았으면 좌표를 대신 보여준다', () => {
    const summary = toObstacleDoneSummary(OBSTACLE, null);

    assert.equal(summary.cards[0]!.body, '37.56650, 126.97800');
  });

  it('심각도마다 지도 반영 문구가 다르다', () => {
    const impassable = toObstacleDoneSummary({ ...OBSTACLE, severity: 'IMPASSABLE' }, null);
    const info = toObstacleDoneSummary({ ...OBSTACLE, severity: 'INFO' }, null);

    assert.equal(impassable.tagLabel, '우회권장');
    assert.match(impassable.cards[1]!.body ?? '', /우회 권장 구간/);
    assert.match(toObstacleDoneSummary(OBSTACLE, null).cards[1]!.body ?? '', /주의 구간/);
    assert.match(info.cards[1]!.body ?? '', /참고 정보/);
  });
});

describe('완료 화면 — 장소 상태 (제보 08)', () => {
  it('장소명·이용 난이도와 주소를 담고 공식 정보를 덮어쓰지 않는다고 알린다', () => {
    const summary = toPlaceDoneSummary(PLACE);

    assert.equal(summary.tagLabel, '일부 불편했어요');
    assert.equal(summary.cards[0]!.title, '서울숲 공원 · 일부 불편했어요');
    assert.equal(summary.cards[0]!.body, '서울 성동구 뚝섬로 273');
    assert.match(summary.cards[1]!.body ?? '', /덮어쓰지 않고/);
    assert.equal(summary.primaryActionLabel, '내 제보 기록 보기');
  });

  it('주소가 없는 장소도 카드가 깨지지 않는다', () => {
    const summary = toPlaceDoneSummary({ ...PLACE, placeAddress: null });

    assert.equal(summary.cards[0]!.body, null);
  });
});

describe('완료 화면 — 시설 상태 (제보 09)', () => {
  it('체크포인트 시설이면 위치 보정 결과를 알려준다', () => {
    const summary = toFacilityDoneSummary(FACILITY);

    assert.equal(summary.heroTitle, '정보를 확인해주셔서 고마워요');
    assert.equal(summary.heroSubtitle, '현재 위치가 지하 1층 본관 엘리베이터 기준으로 보정되었어요');
    assert.equal(summary.cards[0]!.title, '본관 엘리베이터 · 고장');
    assert.equal(summary.cards[0]!.body, '성수동 주민센터 · 지하 1층');
    assert.equal(summary.cards[1]!.title, '위치 보정 결과');
  });

  it('체크포인트가 아니면 보정 문구 대신 지도 반영 문구를 쓴다', () => {
    const summary = toFacilityDoneSummary({ ...FACILITY, calibration: null });

    assert.equal(summary.heroTitle, '제보가 등록됐어요');
    assert.equal(summary.cards[1]!.title, '실내 지도에 반영됐어요');
  });

  it('시설 이름이 없으면 시설 유형으로 대체하고, 모르는 이슈 유형은 원문을 쓴다', () => {
    const summary = toFacilityDoneSummary({
      ...FACILITY,
      nodeName: null,
      issueType: 'LEGACY_VALUE',
    });

    assert.equal(summary.cards[0]!.title, 'ELEVATOR · LEGACY_VALUE');
    assert.equal(summary.tagLabel, 'LEGACY_VALUE');
  });

  it('시설 제보는 사진을 첨부할 수 없어 항상 빈 목록이다', () => {
    assert.deepEqual(toFacilityDoneSummary(FACILITY).photoUrls, []);
  });
});
