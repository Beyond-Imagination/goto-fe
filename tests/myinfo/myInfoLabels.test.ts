import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  MyFacilityReportResponse,
  MyObstacleReportResponse,
  MyPlaceStateReportResponse,
} from '../../src/myinfo/myInfoApi';
import {
  toConfirmedListItem,
  toFacilityReportListItem,
  toPlaceReportListItem,
  toProfileSummary,
  toReportListItem,
} from '../../src/myinfo/myInfoLabels';

const BASE_REPORT: MyObstacleReportResponse = {
  id: 1247,
  issueType: 'SIDEWALK_DAMAGE',
  severity: 'CAUTION',
  status: 'ACTIVE',
  stale: false,
  affectedMobilityTypes: ['WHEELCHAIR'],
  latitude: 37.5665,
  longitude: 126.978,
  address: null,
  photoUrls: [],
  description: null,
  confirmedCount: 5,
  lastConfirmedAt: '2026-08-20T04:15:30Z',
  createdAt: '2026-08-12T04:15:30Z',
};

describe('myInfoLabels', () => {
  it('이동 방식 요약은 한글 라벨로 합치고, 없으면 미설정으로 보여준다', () => {
    assert.equal(toProfileSummary(['WHEELCHAIR']), '휠체어 기준');
    assert.equal(toProfileSummary(['WHEELCHAIR', 'STROLLER']), '휠체어 · 유모차 기준');
    assert.equal(toProfileSummary([]), '이동 방식 미설정');
  });

  it('제보 항목은 유형과 심각도를 제목으로 합치고 날짜를 점 표기로 바꾼다', () => {
    const item = toReportListItem(BASE_REPORT);

    assert.equal(item.title, '보도 파손 · 통행 주의');
    assert.equal(item.meta, '2026.08.12 · 제보 ID 1247');
    assert.equal(item.category, '장애물');
  });

  it('썸네일 지도에 쓸 좌표와 첨부 사진을 그대로 넘긴다', () => {
    const withoutPhoto = toReportListItem(BASE_REPORT);
    assert.equal(withoutPhoto.latitude, 37.5665);
    assert.equal(withoutPhoto.longitude, 126.978);
    assert.equal(withoutPhoto.photoUrl, null);

    const withPhoto = toReportListItem({
      ...BASE_REPORT,
      photoUrls: ['https://cdn.example.test/a.jpg', 'https://cdn.example.test/b.jpg'],
    });
    assert.equal(withPhoto.photoUrl, 'https://cdn.example.test/a.jpg');
  });

  it('주소가 없으면 좌표로 대체 표기하고, 있으면 주소를 쓴다', () => {
    assert.equal(toReportListItem(BASE_REPORT).address, '위치 37.56650, 126.97800');
    assert.equal(
      toReportListItem({ ...BASE_REPORT, address: '서울시 마포구 월드컵로 23길' }).address,
      '서울시 마포구 월드컵로 23길',
    );
  });

  it('확인 수가 있으면 확인 태그를, 해결되면 해결됨 태그를 붙인다', () => {
    assert.deepEqual(toReportListItem(BASE_REPORT).tags, [{ label: '확인 5명', tone: 'green' }]);

    const resolved = toReportListItem({ ...BASE_REPORT, status: 'RESOLVED' });
    assert.equal(resolved.tags[0].label, '해결됨');
    assert.equal(resolved.tags[0].tone, 'blue');
  });

  it('오래된 제보는 확인 필요 태그를 붙인다', () => {
    const stale = toReportListItem({ ...BASE_REPORT, stale: true, confirmedCount: 0 });

    assert.deepEqual(stale.tags, [{ label: '확인 필요', tone: 'amber' }]);
  });

  it('내가 확인한 리포트는 해결 상태로 필터 값을 정하고 id는 확인 기록 id를 쓴다', () => {
    const pending = toConfirmedListItem({
      confirmationId: 31,
      confirmedAt: '2026-08-21T04:15:30Z',
      report: BASE_REPORT,
    });
    assert.equal(pending.id, '31');
    assert.equal(pending.resolution, '아직 있음');
    assert.deepEqual(pending.tags, [{ label: '아직 있음', tone: 'amber' }]);

    const resolved = toConfirmedListItem({
      confirmationId: 32,
      confirmedAt: '2026-08-22T04:15:30Z',
      report: { ...BASE_REPORT, status: 'RESOLVED' },
    });
    assert.equal(resolved.resolution, '해결 됨');
    assert.deepEqual(resolved.tags, [{ label: '해결됨', tone: 'blue' }]);
  });
});

describe('장소 상태 제보 목록 항목', () => {
  const PLACE_REPORT: MyPlaceStateReportResponse = {
    id: 31,
    placeId: 5012,
    placeName: '서울숲 공원',
    address: '서울 성동구 뚝섬로 273',
    latitude: 37.544,
    longitude: 127.037,
    accessStatus: 'PARTIALLY_ACCESSIBLE',
    facilityStatuses: { ELEVATOR: 'BROKEN' },
    photoUrls: [],
    description: '정문 경사로는 있지만 문이 무거워요',
    createdAt: '2026-08-15T04:15:30Z',
  };

  it('「장소」 분류로 장소명·이용 난이도를 제목에 담는다', () => {
    const item = toPlaceReportListItem(PLACE_REPORT);

    assert.equal(item.kind, 'place');
    assert.equal(item.category, '장소');
    assert.equal(item.title, '서울숲 공원 · 일부 불편했어요');
    assert.equal(item.address, '서울 성동구 뚝섬로 273');
    assert.equal(item.meta, '2026.08.15 · 제보 ID 31');
  });

  it('주소가 없으면 장소명으로 대체하고, 좌표가 없으면 0으로 둔다', () => {
    const item = toPlaceReportListItem({
      ...PLACE_REPORT,
      address: null,
      latitude: null,
      longitude: null,
    });

    assert.equal(item.address, '서울숲 공원');
    assert.equal(item.latitude, 0);
    assert.equal(item.longitude, 0);
  });
});

describe('시설 상태 제보 목록 항목', () => {
  const FACILITY_REPORT: MyFacilityReportResponse = {
    id: 77,
    nodeId: 9001,
    nodeType: 'ELEVATOR',
    nodeName: '본관 엘리베이터',
    floorLevel: 2,
    placeId: 5013,
    placeName: '성수동 주민센터',
    address: '서울 성동구 성수이로 118',
    latitude: 37.5445,
    longitude: 127.0553,
    issueType: 'BROKEN',
    description: '점검 안내문만 붙어 있어요',
    createdAt: '2026-08-18T04:15:30Z',
  };

  it('「시설」 분류로 시설명·이슈를 제목에, 장소·층을 위치 줄에 담는다', () => {
    const item = toFacilityReportListItem(FACILITY_REPORT);

    assert.equal(item.kind, 'facility');
    assert.equal(item.category, '시설');
    assert.equal(item.title, '본관 엘리베이터 · 고장');
    assert.equal(item.address, '성수동 주민센터 · 2층');
    assert.equal(item.meta, '2026.08.18 · 제보 ID 77');
    // 시설 제보는 BE에 사진 필드가 없습니다.
    assert.equal(item.photoUrl, null);
  });

  it('지하층은 「지하 N층」으로, 층 정보가 없으면 안내 문구로 보여준다', () => {
    assert.equal(
      toFacilityReportListItem({ ...FACILITY_REPORT, floorLevel: -2 }).address,
      '성수동 주민센터 · 지하 2층',
    );
    assert.equal(
      toFacilityReportListItem({ ...FACILITY_REPORT, floorLevel: null }).address,
      '성수동 주민센터 · 층 정보 없음',
    );
  });

  it('시설 이름이 없으면 유형 라벨로, 모르는 값은 원문으로 대체한다', () => {
    assert.equal(
      toFacilityReportListItem({ ...FACILITY_REPORT, nodeName: null }).title,
      '엘리베이터 · 고장',
    );
    assert.equal(
      toFacilityReportListItem({ ...FACILITY_REPORT, nodeName: null, nodeType: 'GONDOLA' }).title,
      'GONDOLA · 고장',
    );
    assert.equal(
      toFacilityReportListItem({ ...FACILITY_REPORT, issueType: 'LEGACY_VALUE' }).title,
      '본관 엘리베이터 · LEGACY_VALUE',
    );
  });

  it('좌표가 없는 노드는 지도 표시용 값을 0으로 둔다', () => {
    const item = toFacilityReportListItem({ ...FACILITY_REPORT, latitude: null, longitude: null });

    assert.equal(item.latitude, 0);
    assert.equal(item.longitude, 0);
  });
});
