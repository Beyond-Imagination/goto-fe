import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  approximateLocation,
  canReportLocation,
  getRegisteredDeviceToken,
  reportDeviceLocation,
  setRegisteredDeviceToken,
} from '@/push/deviceLocation';
import { FALLBACK_COORDINATES } from '@/help/currentLocation';
import { createMockDeviceTokenApi, resetMockDeviceTokenStore } from '@/push/mockDeviceTokenApi';
import type { DeviceTokenApi } from '@/push/deviceTokenApi';

describe('canReportLocation', () => {
  it('토큰과 좌표가 모두 있어야 보낸다', () => {
    assert.equal(canReportLocation('token', { latitude: 37.5, longitude: 127 }), true);
    assert.equal(canReportLocation(null, { latitude: 37.5, longitude: 127 }), false);
    assert.equal(canReportLocation('token', null), false);
  });

  it('범위를 벗어난 좌표는 보내지 않는다', () => {
    assert.equal(canReportLocation('token', { latitude: 91, longitude: 127 }), false);
    assert.equal(canReportLocation('token', { latitude: 37.5, longitude: 181 }), false);
    assert.equal(canReportLocation('token', { latitude: Number.NaN, longitude: 127 }), false);
  });

  it('(0, 0)은 측위 실패 값으로 보고 보내지 않는다', () => {
    assert.equal(canReportLocation('token', { latitude: 0, longitude: 0 }), false);
  });

  it('측위 실패 시 쓰는 기본 좌표는 보고하지 않는다 — 실제로 그 자리에 있는 게 아니다', () => {
    assert.equal(canReportLocation('token', FALLBACK_COORDINATES), false);
  });
});

describe('approximateLocation', () => {
  it('소수점 3자리로 줄인다 — 약 110m 단위', () => {
    assert.deepEqual(approximateLocation({ latitude: 37.566812345, longitude: 126.977961234 }), {
      latitude: 37.567,
      longitude: 126.978,
    });
  });

  it('0.5는 올림한다 — 서버(HALF_UP)와 같은 규칙', () => {
    assert.deepEqual(approximateLocation({ latitude: 37.5665, longitude: 126.9785 }), {
      latitude: 37.567,
      longitude: 126.979,
    });
  });

  it('음수 좌표도 자릿수만 줄인다', () => {
    assert.deepEqual(approximateLocation({ latitude: -33.868821, longitude: -151.209295 }), {
      latitude: -33.869,
      longitude: -151.209,
    });
  });

  it('오차는 반경(기본 300m)보다 훨씬 작다', () => {
    const raw = { latitude: 37.5664999, longitude: 126.9784999 };
    const approximated = approximateLocation(raw);

    assert.ok(Math.abs(approximated.latitude - raw.latitude) * 111_320 < 60);
    assert.ok(Math.abs(approximated.longitude - raw.longitude) * 88_000 < 60);
  });
});

describe('reportDeviceLocation', () => {
  beforeEach(() => {
    resetMockDeviceTokenStore();
    setRegisteredDeviceToken(null);
  });

  it('등록해 둔 토큰의 위치를 갱신한다', async () => {
    const api = createMockDeviceTokenApi();
    await api.register({ token: 'fcm-1', platform: 'ANDROID' });
    setRegisteredDeviceToken('fcm-1');

    const reported = await reportDeviceLocation(api, { latitude: 37.5665, longitude: 126.978 });

    assert.equal(reported, true);
    assert.equal(getRegisteredDeviceToken(), 'fcm-1');
  });

  it('원좌표가 아니라 뭉갠 좌표를 보낸다', async () => {
    const sent: { latitude: number; longitude: number }[] = [];
    const api: DeviceTokenApi = {
      register: async () => undefined,
      updateLocation: async (_token, latitude, longitude) => {
        sent.push({ latitude, longitude });
      },
      unregister: async () => undefined,
    };

    await reportDeviceLocation(api, { latitude: 37.566812345, longitude: 126.977961234 }, 'fcm-1');

    assert.deepEqual(sent, [{ latitude: 37.567, longitude: 126.978 }]);
  });

  it('등록한 토큰이 없으면 호출조차 하지 않는다', async () => {
    let called = false;
    const api: DeviceTokenApi = {
      register: async () => undefined,
      updateLocation: async () => {
        called = true;
      },
      unregister: async () => undefined,
    };

    const reported = await reportDeviceLocation(api, { latitude: 37.5665, longitude: 126.978 });

    assert.equal(reported, false);
    assert.equal(called, false);
  });

  it('서버 오류가 나도 화면 흐름을 막지 않는다', async () => {
    const api: DeviceTokenApi = {
      register: async () => undefined,
      updateLocation: async () => {
        throw new Error('network');
      },
      unregister: async () => undefined,
    };

    const reported = await reportDeviceLocation(api, { latitude: 37.5665, longitude: 126.978 }, 'fcm-1');

    assert.equal(reported, false);
  });
});
