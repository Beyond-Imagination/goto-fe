import type { PlaceAccessStatus } from '@/myinfo';

import type { SavedPlaceResponse } from './savedPlaceApi';

/** 저장 목록 상단 필터. 피그마 「저장 01」 칩과 같은 순서·문구입니다. */
export const SAVED_FILTERS = ['전체', '변화', '주의', '오래됨'] as const;

export type SavedFilter = (typeof SAVED_FILTERS)[number];

const DAY_MS = 86_400_000;

/** 「변화」로 볼 최근 제보 기간. */
export const RECENT_CHANGE_DAYS = 7;

/** 「오래됨」으로 볼 마지막 확인 경과 기간. */
export const STALE_DAYS = 30;

const ACCESS_STATUS_LABELS: Record<PlaceAccessStatus, string> = {
  ACCESSIBLE: '이용 편함',
  PARTIALLY_ACCESSIBLE: '일부 주의',
  INACCESSIBLE: '이용 어려움',
};

/** 상태를 색으로만 구분하지 않도록 태그 톤과 문구를 함께 씁니다 (화면기획 설계 원칙 #5). */
const ACCESS_STATUS_TONES: Record<PlaceAccessStatus, 'green' | 'amber' | 'red'> = {
  ACCESSIBLE: 'green',
  PARTIALLY_ACCESSIBLE: 'amber',
  INACCESSIBLE: 'red',
};

export type SavedPlaceCardData = Readonly<{
  placeId: number;
  name: string;
  /** 「공원 · 서울 성동구 뚝섬로 273」처럼 합친 한 줄. 둘 다 없으면 null. */
  subtitle: string | null;
  thumbnailUrl: string | null;
  hasIndoorMap: boolean;
  isAvailable: boolean;
  notificationEnabled: boolean;
  statusLabel: string;
  statusTone: 'green' | 'amber' | 'red' | 'muted';
  /** 「3일 전 확인」. 제보가 없으면 「확인 기록 없음」. */
  lastCheckedLabel: string;
}>;

export function toSavedPlaceCard(
  place: SavedPlaceResponse,
  now: number = Date.now(),
): SavedPlaceCardData {
  const status = place.latestAccessStatus;

  return {
    placeId: place.placeId,
    name: place.name,
    subtitle: toSubtitle(place),
    thumbnailUrl: place.thumbnailUrl,
    hasIndoorMap: place.hasIndoorMap,
    isAvailable: place.isAvailable,
    notificationEnabled: place.notificationEnabled,
    statusLabel: status === null ? '상태 제보 없음' : ACCESS_STATUS_LABELS[status],
    statusTone: status === null ? 'muted' : ACCESS_STATUS_TONES[status],
    lastCheckedLabel: toLastCheckedLabel(place.latestReportedAt, now),
  };
}

function toSubtitle(place: SavedPlaceResponse): string | null {
  const parts = [place.category, place.address].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );

  return parts.length > 0 ? parts.join(' · ') : null;
}

/** 「오늘 확인」 「3일 전 확인」. 상태 제보가 없으면 확인 기록 자체가 없습니다. */
export function toLastCheckedLabel(
  latestReportedAt: string | null,
  now: number = Date.now(),
): string {
  if (latestReportedAt === null) {
    return '확인 기록 없음';
  }

  const days = daysSince(latestReportedAt, now);
  if (days === null) {
    return '확인 기록 없음';
  }

  return days <= 0 ? '오늘 확인' : `${days}일 전 확인`;
}

/**
 * 필터 하나를 적용한 목록.
 * 저장 목록은 전체를 한 번에 받으므로(페이지네이션 없음) 화면에서 걸러도 항목이 누락되지 않습니다.
 */
export function filterSavedPlaces(
  places: readonly SavedPlaceResponse[],
  filter: SavedFilter,
  now: number = Date.now(),
): readonly SavedPlaceResponse[] {
  if (filter === '전체') {
    return places;
  }

  return places.filter(place => matchesFilter(place, filter, now));
}

function matchesFilter(place: SavedPlaceResponse, filter: SavedFilter, now: number): boolean {
  const days = daysSince(place.latestReportedAt, now);

  switch (filter) {
    // 최근에 상태 제보가 올라온 곳 — 저장 이후 무엇이 달라졌는지 먼저 보여줍니다.
    case '변화':
      return days !== null && days <= RECENT_CHANGE_DAYS;
    case '주의':
      return (
        place.latestAccessStatus === 'PARTIALLY_ACCESSIBLE' ||
        place.latestAccessStatus === 'INACCESSIBLE'
      );
    // 확인이 오래됐거나 아직 아무도 확인하지 않은 곳.
    case '오래됨':
      return days === null || days >= STALE_DAYS;
    default:
      return true;
  }
}

/** 필터로 걸러 아무것도 남지 않았을 때 목록 하단에 보여줄 문구. */
export function emptyFilterMessage(filter: SavedFilter): string {
  switch (filter) {
    case '변화':
      return `최근 ${RECENT_CHANGE_DAYS}일 안에 상태 제보가 올라온 저장 장소가 없습니다.`;
    case '주의':
      return '주의가 필요하다고 제보된 저장 장소가 없습니다.';
    case '오래됨':
      return `${STALE_DAYS}일 넘게 확인되지 않은 저장 장소가 없습니다.`;
    default:
      return '저장한 장소가 없습니다.';
  }
}

/** 알림이 켜진 저장 장소 수. 헤더 「알림 받는 곳 n곳」에 씁니다. */
export function countNotificationEnabled(places: readonly SavedPlaceResponse[]): number {
  return places.filter(place => place.notificationEnabled).length;
}

/** 경과 일수. 파싱할 수 없는 시각이면 null. */
function daysSince(isoTime: string | null, now: number): number | null {
  if (isoTime === null) {
    return null;
  }

  const parsed = Date.parse(isoTime);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.floor((now - parsed) / DAY_MS);
}
