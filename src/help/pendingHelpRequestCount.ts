import { toVisiblePendingCount, type PendingHelpRequestApi } from './pendingHelpRequestApi';

/**
 * 포커스마다 이전 숫자를 지운 뒤 다시 조회합니다.
 * 배지에 이전 건수가 남아 최신 요청이 stale처럼 보이는 일을 막습니다.
 */
export function startPendingHelpRequestCountLoad(
  api: PendingHelpRequestApi | null,
  onCount: (count: number | null) => void,
): () => void {
  let isCurrent = true;

  onCount(null);

  if (!api) {
    return () => {
      isCurrent = false;
    };
  }

  void api
    .getPendingCount()
    .then((count) => {
      if (isCurrent) {
        onCount(toVisiblePendingCount(count));
      }
    })
    .catch(() => {
      if (isCurrent) {
        onCount(null);
      }
    });

  return () => {
    isCurrent = false;
  };
}
