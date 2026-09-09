import { useCallback, useEffect, useState } from 'react';

import {
  appendPage,
  errorSnapshot,
  firstPageSnapshot,
  initialSnapshot,
  nextCursorToLoad,
  type CursorPage,
  type PageSnapshot,
} from './paginationState';
import type { LoadState } from './useAsyncResource';

export type PaginatedResource<T> = Readonly<{
  /** 첫 페이지 로딩·실패 상태. 이어붙이기 실패는 loadMoreErrorMessage로 알립니다. */
  state: LoadState;
  items: readonly T[];
  errorMessage: string | null;
  hasNext: boolean;
  /** 다음 페이지를 불러오는 중인지. 목록 하단 인디케이터에 씁니다. */
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMore: () => void;
  reload: () => void;
}>;

/**
 * 커서 페이지네이션 목록 훅.
 *
 * `loadPage(cursor)`는 커서가 null이면 첫 페이지를 돌려줘야 합니다. 커서 값은 서버가 준 것을
 * 그대로 되돌려주기만 하므로 이 훅은 내용을 해석하지 않습니다.
 *
 * 상태 전이는 paginationState.ts의 순수 함수에 모아 두었습니다(테스트가 그쪽을 검증합니다).
 * effect 안에서 동기 setState 하지 않도록 상태를 한 스냅샷으로 묶었습니다
 * (React Compiler 린트가 cascading render를 막습니다).
 */
export function usePaginatedResource<T>(
  loadPage: (cursor: string | null) => Promise<CursorPage<T>>,
  fallbackMessage: string,
): PaginatedResource<T> {
  const [requestToken, setRequestToken] = useState(0);
  const [snapshot, setSnapshot] = useState<PageSnapshot<T>>(initialSnapshot<T>);
  const [loadingCursor, setLoadingCursor] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => setRequestToken(token => token + 1), []);

  useEffect(() => {
    let ignore = false;

    loadPage(null)
      .then(page => {
        if (!ignore) {
          setSnapshot(firstPageSnapshot(requestToken, page));
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSnapshot(
            errorSnapshot(requestToken, error instanceof Error ? error.message : fallbackMessage),
          );
        }
      });

    return () => {
      ignore = true;
    };
    // loadPage는 호출부에서 useCallback으로 고정합니다.
  }, [loadPage, fallbackMessage, requestToken]);

  const loadMore = useCallback(() => {
    const cursor = nextCursorToLoad(snapshot, requestToken, loadingCursor);

    if (cursor === null) {
      return;
    }

    setLoadingCursor(cursor);
    setLoadMoreErrorMessage(null);

    loadPage(cursor)
      .then(page => {
        setSnapshot(previous => appendPage(previous, requestToken, cursor, page));
      })
      .catch((error: unknown) => {
        setLoadMoreErrorMessage(error instanceof Error ? error.message : fallbackMessage);
      })
      .finally(() => setLoadingCursor(null));
  }, [fallbackMessage, loadPage, loadingCursor, requestToken, snapshot]);

  // 아직 이번 세대의 첫 페이지가 도착하지 않았으면 로딩으로 취급합니다.
  const settled = snapshot.token === requestToken;

  return {
    state: settled ? snapshot.state : 'loading',
    items: settled ? snapshot.items : [],
    errorMessage: settled ? snapshot.errorMessage : null,
    hasNext: settled && snapshot.nextCursor !== null,
    isLoadingMore: loadingCursor !== null,
    loadMoreErrorMessage,
    loadMore,
    reload,
  };
}
