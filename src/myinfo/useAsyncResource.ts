import { useCallback, useEffect, useState } from 'react';

export type LoadState = 'loading' | 'error' | 'success';

type Snapshot<T> = Readonly<{
  /** 이 스냅샷이 어느 요청의 결과인지 구분하는 값. 재요청하면 증가합니다. */
  token: number;
  state: LoadState;
  data: T | null;
  errorMessage: string | null;
}>;

export type AsyncResource<T> = Readonly<{
  state: LoadState;
  data: T | null;
  errorMessage: string | null;
  reload: () => void;
}>;

/**
 * 로딩 · 에러 · 성공 3상태를 관리하는 조회 훅.
 * 상태를 한 객체로 묶어 effect 안에서 로딩 상태를 동기 setState 하지 않도록 했습니다
 * (React Compiler 린트가 cascading render를 막습니다).
 */
export function useAsyncResource<T>(
  load: () => Promise<T>,
  fallbackMessage: string,
): AsyncResource<T> {
  const [requestToken, setRequestToken] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    token: -1,
    state: 'loading',
    data: null,
    errorMessage: null,
  });

  const reload = useCallback(() => setRequestToken(token => token + 1), []);

  useEffect(() => {
    let ignore = false;

    load()
      .then(result => {
        if (!ignore) {
          setSnapshot({ token: requestToken, state: 'success', data: result, errorMessage: null });
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSnapshot({
            token: requestToken,
            state: 'error',
            data: null,
            errorMessage: error instanceof Error ? error.message : fallbackMessage,
          });
        }
      });

    return () => {
      ignore = true;
    };
    // load는 호출부에서 useCallback으로 고정합니다.
  }, [load, fallbackMessage, requestToken]);

  // 아직 이번 요청의 결과가 도착하지 않았으면 로딩으로 취급합니다.
  const settled = snapshot.token === requestToken;

  return {
    state: settled ? snapshot.state : 'loading',
    data: settled ? snapshot.data : null,
    errorMessage: settled ? snapshot.errorMessage : null,
    reload,
  };
}
