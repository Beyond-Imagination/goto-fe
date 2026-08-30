const MINUTE_MS = 60_000;

/** ISO 시각까지 남은 분. 이미 지났으면 0. */
export function minutesUntil(isoTime: string, now: number = Date.now()): number {
  const remaining = new Date(isoTime).getTime() - now;
  return remaining > 0 ? Math.ceil(remaining / MINUTE_MS) : 0;
}

/** ISO 시각으로부터 지난 분. */
export function minutesSince(isoTime: string, now: number = Date.now()): number {
  const elapsed = now - new Date(isoTime).getTime();
  return elapsed > 0 ? Math.floor(elapsed / MINUTE_MS) : 0;
}

/** 만료까지 남은 시간 라벨. 「48분 남음」 */
export function formatRemaining(expiresAt: string, now: number = Date.now()): string {
  const minutes = minutesUntil(expiresAt, now);
  return minutes > 0 ? `${minutes}분 남음` : '만료됨';
}

/** 요청이 올라온 지 얼마나 됐는지. 「방금 전」 「48분 전」 */
export function formatElapsed(requestedAt: string, now: number = Date.now()): string {
  const minutes = minutesSince(requestedAt, now);
  return minutes < 1 ? '방금 전' : `${minutes}분 전`;
}

/**
 * 남은 시간이 짧을수록 급한 요청이라 강조 색이 달라집니다.
 * 색만으로 구분하지 않도록 라벨 문구도 함께 씁니다.
 */
export function isUrgentRemaining(expiresAt: string, now: number = Date.now()): boolean {
  return minutesUntil(expiresAt, now) >= 30;
}

export function formatDistance(distanceMeters: number): string {
  return distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)}km`
    : `${Math.round(distanceMeters)}m`;
}
