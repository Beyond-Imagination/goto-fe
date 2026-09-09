import { useCallback, useEffect, useState } from 'react';

import type { LoadState } from '@/myinfo';

import {
  applyNotification,
  initialSavedSnapshot,
  insertPlaceAt,
  loadedSavedSnapshot,
  removePlace,
  replacePlace,
  savedErrorSnapshot,
  settledView,
  type SavedListSnapshot,
} from './savedListState';
import type { SavedPlaceApi, SavedPlaceResponse } from './savedPlaceApi';

const LOAD_ERROR_MESSAGE = '저장한 장소를 불러오지 못했어요. 다시 시도해주세요.';
const NOTIFICATION_ERROR_MESSAGE = '알림 설정을 바꾸지 못했어요. 다시 시도해주세요.';
const UNSAVE_ERROR_MESSAGE = '저장을 해제하지 못했어요. 다시 시도해주세요.';

export type SavedPlacesResource = Readonly<{
  state: LoadState;
  places: readonly SavedPlaceResponse[];
  errorMessage: string | null;
  /** 요청이 진행 중인 장소들. 카드의 스위치·하트를 잠그는 데 씁니다. */
  busyPlaceIds: readonly number[];
  /** 목록은 그대로 두고 위쪽에 띄우는 실패 안내. */
  actionErrorMessage: string | null;
  toggleNotification: (placeId: number, enabled: boolean) => void;
  unsave: (placeId: number) => void;
  reload: () => void;
}>;

/**
 * 저장 탭의 목록 상태.
 *
 * 알림 스위치와 저장 해제는 화면에서 먼저 반영하고(낙관적 갱신) 실패하면 되돌립니다.
 * 스위치를 눌렀는데 목록이 한 바퀴 다시 그려질 때까지 아무 일도 안 일어나면
 * 눌리지 않은 것처럼 느껴지기 때문입니다.
 *
 * 상태 전이는 savedListState.ts의 순수 함수에 모아 두었습니다(테스트가 그쪽을 검증합니다).
 */
export function useSavedPlaces(api: SavedPlaceApi): SavedPlacesResource {
  const [requestToken, setRequestToken] = useState(0);
  const [snapshot, setSnapshot] = useState<SavedListSnapshot>(initialSavedSnapshot);
  const [busyPlaceIds, setBusyPlaceIds] = useState<readonly number[]>([]);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => setRequestToken(token => token + 1), []);

  useEffect(() => {
    let ignore = false;

    api
      .findMine()
      .then(places => {
        if (!ignore) {
          setSnapshot(loadedSavedSnapshot(requestToken, places));
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSnapshot(
            savedErrorSnapshot(
              requestToken,
              error instanceof Error ? error.message : LOAD_ERROR_MESSAGE,
            ),
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [api, requestToken]);

  const release = useCallback((placeId: number) => {
    setBusyPlaceIds(previous => previous.filter(id => id !== placeId));
  }, []);

  const toggleNotification = useCallback(
    (placeId: number, enabled: boolean) => {
      setActionErrorMessage(null);
      setBusyPlaceIds(previous => (previous.includes(placeId) ? previous : [...previous, placeId]));
      setSnapshot(previous => applyNotification(previous, requestToken, placeId, enabled));

      api
        .updateNotification(placeId, enabled)
        .then(updated => {
          setSnapshot(previous => replacePlace(previous, requestToken, updated));
        })
        .catch((error: unknown) => {
          // 낙관적으로 바꿔둔 스위치를 되돌립니다.
          setSnapshot(previous => applyNotification(previous, requestToken, placeId, !enabled));
          setActionErrorMessage(
            error instanceof Error ? error.message : NOTIFICATION_ERROR_MESSAGE,
          );
        })
        .finally(() => release(placeId));
    },
    [api, release, requestToken],
  );

  const unsave = useCallback(
    (placeId: number) => {
      const index = snapshot.places.findIndex(place => place.placeId === placeId);
      const removed = index >= 0 ? snapshot.places[index] : null;

      if (removed === null) {
        return;
      }

      setActionErrorMessage(null);
      setBusyPlaceIds(previous => (previous.includes(placeId) ? previous : [...previous, placeId]));
      setSnapshot(previous => removePlace(previous, requestToken, placeId));

      api
        .unsave(placeId)
        .catch((error: unknown) => {
          setSnapshot(previous => insertPlaceAt(previous, requestToken, removed, index));
          setActionErrorMessage(error instanceof Error ? error.message : UNSAVE_ERROR_MESSAGE);
        })
        .finally(() => release(placeId));
    },
    [api, release, requestToken, snapshot.places],
  );

  const view = settledView(snapshot, requestToken);

  return {
    state: view.state,
    places: view.places,
    errorMessage: view.errorMessage,
    busyPlaceIds,
    actionErrorMessage,
    toggleNotification,
    unsave,
    reload,
  };
}
