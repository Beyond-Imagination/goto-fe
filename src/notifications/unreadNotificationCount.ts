import type { NotificationApi } from './notificationApi';

/**
 * 화면에 보일 안 읽은 알림 수. 0이나 음수는 배지를 숨기는 뜻으로 null로 만듭니다.
 * (도움 요청 대기 배지의 toVisiblePendingCount와 같은 규칙입니다.)
 */
export function toVisibleUnreadCount(count: number): number | null {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : null;
}

/**
 * 포커스마다 이전 숫자를 지운 뒤 다시 조회합니다.
 * 알림을 읽고 돌아왔는데 배지에 옛 숫자가 남아 있으면 읽지 않은 것처럼 보입니다.
 */
export function startUnreadNotificationCountLoad(
  api: NotificationApi | null,
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
    .countUnread()
    .then(count => {
      if (isCurrent) {
        onCount(toVisibleUnreadCount(count));
      }
    })
    .catch(() => {
      // 배지는 부가 정보라, 실패하면 조용히 숨깁니다.
      if (isCurrent) {
        onCount(null);
      }
    });

  return () => {
    isCurrent = false;
  };
}
