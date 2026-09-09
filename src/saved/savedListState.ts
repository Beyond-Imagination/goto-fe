import type { LoadState } from '@/myinfo';

import type { SavedPlaceResponse } from './savedPlaceApi';

/**
 * 저장 목록 화면이 들고 있는 상태 한 벌.
 *
 * token은 "몇 번째 조회 세대인지"입니다. 새로고침으로 세대가 바뀐 뒤 늦게 도착한
 * 이전 세대 응답을 버리는 데 씁니다(myinfo의 paginationState와 같은 규칙).
 */
export type SavedListSnapshot = Readonly<{
  token: number;
  state: LoadState;
  places: readonly SavedPlaceResponse[];
  errorMessage: string | null;
}>;

export function initialSavedSnapshot(): SavedListSnapshot {
  return { token: -1, state: 'loading', places: [], errorMessage: null };
}

export function loadedSavedSnapshot(
  token: number,
  places: readonly SavedPlaceResponse[],
): SavedListSnapshot {
  return { token, state: 'success', places, errorMessage: null };
}

export function savedErrorSnapshot(token: number, errorMessage: string): SavedListSnapshot {
  return { token, state: 'error', places: [], errorMessage };
}

/**
 * 알림 스위치를 화면에서 먼저 바꿉니다(낙관적 갱신).
 * 세대가 바뀌었으면 목록 자체가 새로 왔다는 뜻이라 건드리지 않습니다.
 */
export function applyNotification(
  snapshot: SavedListSnapshot,
  token: number,
  placeId: number,
  enabled: boolean,
): SavedListSnapshot {
  if (snapshot.token !== token) {
    return snapshot;
  }

  return {
    ...snapshot,
    places: snapshot.places.map(place =>
      place.placeId === placeId ? { ...place, notificationEnabled: enabled } : place,
    ),
  };
}

/** 서버 응답으로 항목 하나를 덮어씁니다. 응답에 없는 항목이면 아무 것도 하지 않습니다. */
export function replacePlace(
  snapshot: SavedListSnapshot,
  token: number,
  place: SavedPlaceResponse,
): SavedListSnapshot {
  if (snapshot.token !== token) {
    return snapshot;
  }

  return {
    ...snapshot,
    places: snapshot.places.map(existing =>
      existing.placeId === place.placeId ? place : existing,
    ),
  };
}

export function removePlace(
  snapshot: SavedListSnapshot,
  token: number,
  placeId: number,
): SavedListSnapshot {
  if (snapshot.token !== token) {
    return snapshot;
  }

  return {
    ...snapshot,
    places: snapshot.places.filter(place => place.placeId !== placeId),
  };
}

/**
 * 저장 해제가 실패했을 때 원래 자리로 되돌립니다.
 * 목록은 최근 저장순이라 맨 뒤에 붙이면 순서가 뒤바뀝니다.
 */
export function insertPlaceAt(
  snapshot: SavedListSnapshot,
  token: number,
  place: SavedPlaceResponse,
  index: number,
): SavedListSnapshot {
  if (
    snapshot.token !== token ||
    snapshot.places.some(existing => existing.placeId === place.placeId)
  ) {
    return snapshot;
  }

  const places = snapshot.places.slice();
  places.splice(Math.max(0, Math.min(index, places.length)), 0, place);

  return { ...snapshot, places };
}

/** 화면에 보여줄 값. 이번 세대의 응답이 아직이면 로딩으로 취급합니다. */
export function settledView(snapshot: SavedListSnapshot, token: number): SavedListSnapshot {
  return snapshot.token === token ? snapshot : initialSavedSnapshot();
}
