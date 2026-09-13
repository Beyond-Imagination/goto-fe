export type Tier<T> = { min: number; value: T };

/**
 * count가 min 이상인 첫 tier(내림차순 정렬 가정)의 value를 반환하고, 매칭되는 tier가
 * 없으면 fallback을 반환한다. "건수 구간별로 다른 값을 고른다"는 모양은 이 홈 지도
 * 화면 안에서 여러 곳(클러스터 마커 크기/캡션 등)에 반복되는데, 임계값·반환값 자체는
 * 곳마다 Figma 스펙이 달라 각 호출부에 그대로 둔다 — 이 함수는 "구간 판정" 로직 모양만
 * 공유한다.
 */
export function tieredValue<T>(count: number, tiers: readonly Tier<T>[], fallback: T): T {
  for (const tier of tiers) {
    if (count >= tier.min) {
      return tier.value;
    }
  }
  return fallback;
}
