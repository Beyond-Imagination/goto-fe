import type { DeviceLocation } from './deviceLocation';

/**
 * 주기 위치 보고의 간격과 조건.
 *
 * <p>서버는 「주변 도움 요청」 푸시 대상을 기기의 마지막 위치로 고르고, 6시간이 지난 위치는
 * 대상에서 뺍니다(goto.push.location-freshness). 그래서 앱을 쓰는 동안 주기적으로 갱신해 두면
 * 사용자가 「도움 주기」 화면을 열지 않아도 주변 요청을 받을 수 있습니다.
 *
 * <p>다만 측위는 배터리를 쓰고 보고는 네트워크를 쓰므로, 시간과 이동거리 둘 다로 거릅니다.
 */

/** 보고 주기. 서버의 위치 신선도(6시간)보다 훨씬 짧게 둬서 만료로 대상에서 빠지지 않게 합니다. */
export const LOCATION_REPORT_INTERVAL_MS = 10 * 60_000;

/** 이만큼 움직이지 않았으면 시간이 지나도 다시 보내지 않습니다. */
export const LOCATION_REPORT_MIN_DISTANCE_METERS = 100;

/**
 * 위치가 오래돼 보고를 건너뛸 수 없는 시간.
 * 제자리에 있어도 이 시간이 지나면 한 번은 갱신해, 서버에서 위치가 만료되지 않게 합니다.
 */
export const LOCATION_REPORT_MAX_AGE_MS = 60 * 60_000;

export type LocationReport = Readonly<{
  location: DeviceLocation;
  reportedAt: number;
}>;

/** 두 좌표 사이 거리(m). 짧은 거리만 비교하므로 구면 근사(하버사인)로 충분합니다. */
export function distanceMeters(from: DeviceLocation, to: DeviceLocation): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * 지금 보고해야 하는지.
 *
 * <p>한 번도 안 보냈으면 보고하고, 그 뒤로는 (1) 충분히 움직였거나 (2) 마지막 보고가 오래됐을 때만
 * 보고합니다. 가만히 앉아 있는 사용자가 10분마다 같은 좌표를 올리는 일을 막습니다.
 */
export function shouldReportLocation(
  previous: LocationReport | null,
  next: DeviceLocation,
  now: number,
): boolean {
  if (previous === null) {
    return true;
  }

  if (now - previous.reportedAt >= LOCATION_REPORT_MAX_AGE_MS) {
    return true;
  }

  return distanceMeters(previous.location, next) >= LOCATION_REPORT_MIN_DISTANCE_METERS;
}
