import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  distanceMeters,
  LOCATION_REPORT_MAX_AGE_MS,
  LOCATION_REPORT_MIN_DISTANCE_METERS,
  shouldReportLocation,
  type LocationReport,
} from '@/push/locationReportSchedule';

const NOW = Date.parse('2026-09-12T12:00:00Z');
const SEOUL = { latitude: 37.5665, longitude: 126.978 };

/** 위도 1도 ≈ 111km. 원하는 거리(m)만큼 북쪽으로 옮긴 좌표. */
function metersNorth(meters: number) {
  return { latitude: SEOUL.latitude + meters / 111_320, longitude: SEOUL.longitude };
}

function reported(location = SEOUL, agoMs = 0): LocationReport {
  return { location, reportedAt: NOW - agoMs };
}

describe('distanceMeters', () => {
  it('같은 좌표는 0이다', () => {
    assert.equal(Math.round(distanceMeters(SEOUL, SEOUL)), 0);
  });

  it('북쪽으로 옮긴 만큼의 거리를 돌려준다', () => {
    assert.ok(Math.abs(distanceMeters(SEOUL, metersNorth(100)) - 100) < 2);
    assert.ok(Math.abs(distanceMeters(SEOUL, metersNorth(1000)) - 1000) < 10);
  });

  it('방향과 무관하게 같은 거리다', () => {
    const a = distanceMeters(SEOUL, metersNorth(500));
    const b = distanceMeters(metersNorth(500), SEOUL);

    assert.ok(Math.abs(a - b) < 0.001);
  });
});

describe('shouldReportLocation', () => {
  it('한 번도 보내지 않았으면 보고한다', () => {
    assert.equal(shouldReportLocation(null, SEOUL, NOW), true);
  });

  it('제자리에 있으면 보고하지 않는다 — 같은 좌표를 주기마다 올리지 않는다', () => {
    assert.equal(shouldReportLocation(reported(), metersNorth(10), NOW), false);
  });

  it('충분히 움직였으면 보고한다', () => {
    // metersNorth는 위도 1도를 111,320m로 잡은 근사라 경계 바로 위/아래로 여유를 둡니다.
    assert.equal(
      shouldReportLocation(reported(), metersNorth(LOCATION_REPORT_MIN_DISTANCE_METERS + 5), NOW),
      true,
    );
    assert.equal(
      shouldReportLocation(reported(), metersNorth(LOCATION_REPORT_MIN_DISTANCE_METERS - 5), NOW),
      false,
    );
  });

  it('제자리라도 마지막 보고가 오래됐으면 갱신한다 — 서버에서 위치가 만료되지 않게', () => {
    assert.equal(shouldReportLocation(reported(SEOUL, LOCATION_REPORT_MAX_AGE_MS), SEOUL, NOW), true);
    assert.equal(
      shouldReportLocation(reported(SEOUL, LOCATION_REPORT_MAX_AGE_MS - 60_000), SEOUL, NOW),
      false,
    );
  });
});
