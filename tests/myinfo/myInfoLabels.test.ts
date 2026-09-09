import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { MyObstacleReportResponse } from '../../src/myinfo/myInfoApi';
import {
  toConfirmedListItem,
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
