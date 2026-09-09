import type { LoadState } from './useAsyncResource';

/** 커서 페이지 응답의 공통 모양. */
export type CursorPage<T> = Readonly<{
  items: readonly T[];
  nextCursor: string | null;
}>;

/**
 * 목록 화면이 들고 있는 상태 한 벌.
 *
 * token은 "몇 번째 요청 세대인지"입니다. 새로고침·필터 변경으로 세대가 바뀐 뒤 늦게 도착한
 * 이전 세대 응답을 버리는 데 씁니다.
 */
export type PageSnapshot<T> = Readonly<{
  token: number;
  state: LoadState;
  items: readonly T[];
  nextCursor: string | null;
  errorMessage: string | null;
}>;

export function initialSnapshot<T>(): PageSnapshot<T> {
  return { token: -1, state: 'loading', items: [], nextCursor: null, errorMessage: null };
}

export function firstPageSnapshot<T>(token: number, page: CursorPage<T>): PageSnapshot<T> {
  return {
    token,
    state: 'success',
    items: page.items,
    nextCursor: page.nextCursor,
    errorMessage: null,
  };
}

export function errorSnapshot<T>(token: number, errorMessage: string): PageSnapshot<T> {
  return { token, state: 'error', items: [], nextCursor: null, errorMessage };
}

/**
 * 다음 페이지를 뒤에 이어 붙입니다.
 *
 * 세대가 바뀌었거나(token 불일치) 그 사이 커서가 이미 넘어갔으면(cursor 불일치) 늦게 온 응답으로
 * 판단해 아무 것도 하지 않습니다. 이 두 조건이 없으면 같은 페이지가 두 번 붙거나,
 * 필터를 바꾼 목록에 이전 필터의 항목이 섞입니다.
 */
export function appendPage<T>(
  previous: PageSnapshot<T>,
  requestToken: number,
  cursor: string,
  page: CursorPage<T>,
): PageSnapshot<T> {
  if (previous.token !== requestToken || previous.nextCursor !== cursor) {
    return previous;
  }

  return { ...previous, items: [...previous.items, ...page.items], nextCursor: page.nextCursor };
}

/** 지금 다음 페이지를 요청해도 되는지. 이미 같은 커서를 불러오는 중이면 중복 요청을 막습니다. */
export function nextCursorToLoad<T>(
  snapshot: PageSnapshot<T>,
  requestToken: number,
  loadingCursor: string | null,
): string | null {
  if (snapshot.token !== requestToken || snapshot.nextCursor === null) {
    return null;
  }
  return loadingCursor === snapshot.nextCursor ? null : snapshot.nextCursor;
}
