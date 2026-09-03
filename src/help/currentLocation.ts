/**
 * 현재 위치.
 *
 * TODO: 아직 위치 권한/측위 라이브러리(expo-location 등)가 붙어 있지 않아서
 * 디자인 시안과 같은 고정 좌표를 씁니다. 측위가 붙으면 이 모듈만 교체하면 됩니다.
 */
/**
 * 도움 요청이 주변 사용자에게 닿는 반경. 대기 화면 안내 문구에만 씁니다.
 *
 * TODO(푸시): 현재 서버에는 이 반경으로 발송하는 로직이 없습니다. 도우미가 GET /nearby를
 * 조회할 때의 반경(기본 1000m)과도 별개의 값이라, 푸시 발송이 추가되면 서버가 실제로 사용하는
 * 발송 반경과 이 값을 일치시켜야 합니다.
 */
export const HELP_REQUEST_REACH_METERS = 300;

export type Coordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

/** 시안에 찍혀 있는 좌표(경주). */
export const FALLBACK_COORDINATES: Coordinates = {
  latitude: 35.829437,
  longitude: 129.228655,
};

export function formatCoordinates({ latitude, longitude }: Coordinates): string {
  return `${latitude}, ${longitude}`;
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  return FALLBACK_COORDINATES;
}
