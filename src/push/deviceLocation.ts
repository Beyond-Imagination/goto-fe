import { logger } from '@/utils/logger';

import { FALLBACK_COORDINATES } from '@/help/currentLocation';

import type { DeviceTokenApi } from './deviceTokenApi';

/**
 * 이 기기가 서버에 등록한 FCM 토큰.
 *
 * <p>「주변 도움 요청」 푸시는 기기의 마지막 위치로 대상을 고르는데, 위치를 아는 화면과
 * 토큰을 아는 화면이 달라서 모듈 수준에 둡니다. PushProvider가 등록·해제 때 갱신합니다.
 */
let registeredToken: string | null = null;

export function setRegisteredDeviceToken(token: string | null): void {
  registeredToken = token;
}

export function getRegisteredDeviceToken(): string | null {
  return registeredToken;
}

export type DeviceLocation = Readonly<{ latitude: number; longitude: number }>;

/**
 * 서버에 보낼 좌표의 정밀도. 소수점 3자리는 위도 기준 약 110m입니다.
 *
 * <p>서버도 저장 직전에 같은 자리로 줄이지만(BE CoordinatePrecision), 여기서 한 번 더 줄여
 * 원좌표가 기기를 떠나지 않게 합니다. 반경 판정(기본 300m)에는 충분한 정밀도입니다.
 */
export const COORDINATE_DECIMALS = 3;

export function approximateLocation(location: DeviceLocation): DeviceLocation {
  return {
    latitude: roundTo(location.latitude, COORDINATE_DECIMALS),
    longitude: roundTo(location.longitude, COORDINATE_DECIMALS),
  };
}

/** 0.5는 항상 올림합니다(BE의 HALF_UP과 같은 규칙). */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** 보낼 수 있는 좌표인지. 토큰이 없거나 값이 이상하면 보내지 않습니다. */
export function canReportLocation(token: string | null, location: DeviceLocation | null): boolean {
  if (token === null || location === null) {
    return false;
  }

  const { latitude, longitude } = location;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return false;
  }

  // 측위 실패 시 쓰는 시안 좌표는 "지금 거기 있다"는 뜻이 아니라서 보고하지 않습니다.
  return !(latitude === FALLBACK_COORDINATES.latitude && longitude === FALLBACK_COORDINATES.longitude);
}

export async function reportDeviceLocation(
  api: DeviceTokenApi,
  location: DeviceLocation | null,
  token: string | null = registeredToken,
): Promise<boolean> {
  if (!canReportLocation(token, location)) {
    return false;
  }

  try {
    const approximated = approximateLocation(location as DeviceLocation);
    await api.updateLocation(token as string, approximated.latitude, approximated.longitude);
    return true;
  } catch (error) {
    // 위치 보고는 부가 기능입니다. 실패해도 화면 흐름을 막지 않습니다.
    logger.warn('기기 위치를 보고하지 못했습니다.', error);
    return false;
  }
}
