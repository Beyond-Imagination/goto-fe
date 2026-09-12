import { logger } from '@/utils/logger';

/**
 * 현재 위치.
 *
 * <p>측위는 expo-location으로 하고, 권한이 없거나 좌표를 얻지 못하면 시안 좌표로 물러섭니다.
 * 화면들은 좌표가 없는 상태를 다루지 않아도 되고(항상 값을 받습니다), 위치 없이도 앱은 돕니다.
 */

/**
 * 도움 요청이 주변 사용자에게 닿는 반경. 대기 화면 안내 문구에 씁니다.
 *
 * 서버가 실제로 푸시를 보내는 반경(goto.push.help-request-radius-meters)과 같은 값이어야 합니다.
 * 도우미가 GET /nearby를 조회할 때의 반경(기본 1000m)은 별개입니다 — 그쪽은 "목록에 보이는 범위"입니다.
 */
export const HELP_REQUEST_REACH_METERS = 300;

export type Coordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

/** 시안에 찍혀 있는 좌표(경주). 측위에 실패했을 때만 씁니다. */
export const FALLBACK_COORDINATES: Coordinates = {
  latitude: 35.829437,
  longitude: 129.228655,
};

export function formatCoordinates({ latitude, longitude }: Coordinates): string {
  return `${latitude}, ${longitude}`;
}

/**
 * 쓸 수 있는 좌표인지.
 *
 * <p>(0, 0)은 측위 실패 시 기기가 흔히 돌려주는 값이라 좌표로 보지 않습니다(바다 한가운데입니다).
 */
export function isUsableCoordinates(value: Coordinates | null | undefined): value is Coordinates {
  if (!value) {
    return false;
  }

  const { latitude, longitude } = value;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** expo-location 응답에서 좌표만 뽑습니다. 값이 이상하면 null. */
export function toCoordinates(position: { coords?: Coordinates } | null | undefined): Coordinates | null {
  const coords = position?.coords;
  return isUsableCoordinates(coords) ? { latitude: coords.latitude, longitude: coords.longitude } : null;
}

type LocationModule = typeof import('expo-location');

/**
 * 네이티브 모듈은 한 번만 불러오고 결과를 기억합니다.
 * 측위 모듈이 없는 빌드(Expo Go 등)에서는 매번 require를 다시 시도하지 않습니다.
 */
let locationCache: { readonly value: LocationModule | null } | null = null;

/**
 * 측위 네이티브 모듈이 이 빌드에 들어 있는지.
 *
 * <p>없는 빌드(Expo Go 등)에서 expo-location을 require하면 모듈 초기화 중에 잡을 수 없는
 * 오류가 나서 개발 화면을 덮습니다. requireOptionalNativeModule은 없으면 null을 돌려줍니다.
 */
function hasLocationNativeModule(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 위와 같은 이유입니다.
    const core = require('expo-modules-core') as typeof import('expo-modules-core');
    return core.requireOptionalNativeModule('ExpoLocation') != null;
  } catch {
    return false;
  }
}

function loadLocation(): LocationModule | null {
  if (locationCache !== null) {
    return locationCache.value;
  }

  if (!hasLocationNativeModule()) {
    logger.debug('측위 모듈이 없는 빌드입니다. 기본 좌표를 씁니다.');
    locationCache = { value: null };
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 정적 import면 네이티브 모듈이 없는 환경에서 기동 자체가 막힙니다.
    const module = require('expo-location') as LocationModule;
    locationCache = {
      value: typeof module?.getForegroundPermissionsAsync === 'function' ? module : null,
    };
  } catch (error) {
    logger.warn('측위 모듈이 없어 기본 좌표를 씁니다.', error);
    locationCache = { value: null };
  }

  return locationCache.value;
}

/** 마지막으로 확인한 위치. 화면을 옮길 때마다 측위를 다시 기다리지 않기 위해 기억합니다. */
let lastKnown: Coordinates | null = null;

export function getLastKnownCoordinates(): Coordinates | null {
  return lastKnown;
}

/** 테스트·로그아웃처럼 기억한 위치를 지워야 할 때. */
export function resetLastKnownCoordinates(): void {
  lastKnown = null;
}

/**
 * 위치 권한을 확인하고, 아직 묻지 않았으면 물어봅니다.
 * 이미 거부했으면 다시 묻지 않습니다 — 시스템 설정에서만 되돌릴 수 있습니다.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  const location = loadLocation();
  if (location === null) {
    return false;
  }

  try {
    const current = await location.getForegroundPermissionsAsync();
    if (current.granted) {
      return true;
    }
    if (!current.canAskAgain) {
      return false;
    }

    const requested = await location.requestForegroundPermissionsAsync();
    return requested.granted;
  } catch (error) {
    logger.warn('위치 권한을 확인하지 못했습니다.', error);
    return false;
  }
}

/**
 * 권한을 묻지 않고 현재 상태만 봅니다.
 * 주기적인 위치 보고처럼 "사용자가 지금 요청한 게 아닌" 측위는 이걸로 먼저 확인해야
 * 뜬금없는 시점에 권한 팝업이 뜨지 않습니다.
 */
export async function hasLocationPermission(): Promise<boolean> {
  const location = loadLocation();
  if (location === null) {
    return false;
  }

  try {
    return (await location.getForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * 이미 권한이 있을 때만 측위합니다. 권한이 없거나 실패하면 null — 기본 좌표로 대체하지 않습니다.
 * (기본 좌표를 "현재 위치"로 보고하면 그 자리에 없는 사람에게 주변 알림이 갑니다.)
 */
export async function getCoordinatesWithoutPrompt(): Promise<Coordinates | null> {
  const location = loadLocation();
  if (location === null || !(await hasLocationPermission())) {
    return null;
  }

  try {
    const current = toCoordinates(
      await location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced }),
    );
    if (current !== null) {
      lastKnown = current;
      return current;
    }

    const cached = toCoordinates(await location.getLastKnownPositionAsync());
    if (cached !== null) {
      lastKnown = cached;
    }
    return cached;
  } catch (error) {
    logger.warn('현재 위치를 가져오지 못했습니다.', error);
    return null;
  }
}

/**
 * 지금 위치. 실패하면 마지막으로 알던 위치, 그것도 없으면 시안 좌표를 돌려줍니다.
 *
 * <p>최근 위치(getLastKnownPositionAsync)를 먼저 보는 이유는 화면 진입이 GPS 측위를 기다리며
 * 멈추지 않게 하기 위해서입니다. 정확한 좌표는 그 다음에 갱신됩니다.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const location = loadLocation();
  if (location === null || !(await ensureLocationPermission())) {
    return lastKnown ?? FALLBACK_COORDINATES;
  }

  try {
    const cached = toCoordinates(await location.getLastKnownPositionAsync());
    if (cached !== null) {
      lastKnown = cached;
    }

    const current = toCoordinates(
      await location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced }),
    );
    if (current !== null) {
      lastKnown = current;
    }
  } catch (error) {
    logger.warn('현재 위치를 가져오지 못했습니다.', error);
  }

  return lastKnown ?? FALLBACK_COORDINATES;
}
