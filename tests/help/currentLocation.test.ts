import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FALLBACK_COORDINATES,
  formatCoordinates,
  isUsableCoordinates,
  toCoordinates,
} from '@/help/currentLocation';

describe('isUsableCoordinates', () => {
  it('정상 좌표는 통과한다', () => {
    assert.equal(isUsableCoordinates({ latitude: 37.5665, longitude: 126.978 }), true);
    assert.equal(isUsableCoordinates(FALLBACK_COORDINATES), true);
  });

  it('(0, 0)은 측위 실패 값으로 보고 거른다', () => {
    assert.equal(isUsableCoordinates({ latitude: 0, longitude: 0 }), false);
  });

  it('위경도 범위를 벗어나거나 숫자가 아니면 거른다', () => {
    assert.equal(isUsableCoordinates({ latitude: 91, longitude: 126.978 }), false);
    assert.equal(isUsableCoordinates({ latitude: 37.5, longitude: -181 }), false);
    assert.equal(isUsableCoordinates({ latitude: Number.NaN, longitude: 126.978 }), false);
    assert.equal(isUsableCoordinates(null), false);
    assert.equal(isUsableCoordinates(undefined), false);
  });

  it('경도 0(그리니치)만 있는 좌표는 정상으로 본다', () => {
    assert.equal(isUsableCoordinates({ latitude: 51.4769, longitude: 0 }), true);
  });
});

describe('toCoordinates', () => {
  it('측위 응답에서 좌표만 뽑는다', () => {
    assert.deepEqual(toCoordinates({ coords: { latitude: 37.5665, longitude: 126.978 } }), {
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it('쓸 수 없는 좌표나 빈 응답은 null이다', () => {
    assert.equal(toCoordinates({ coords: { latitude: 0, longitude: 0 } }), null);
    assert.equal(toCoordinates({}), null);
    assert.equal(toCoordinates(null), null);
    assert.equal(toCoordinates(undefined), null);
  });
});

describe('formatCoordinates', () => {
  it('위도, 경도 순서로 적는다', () => {
    assert.equal(formatCoordinates({ latitude: 35.8348, longitude: 129.2249 }), '35.8348, 129.2249');
  });
});
