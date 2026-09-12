import type { PushNotificationType } from '@/push/pushRouting';

import type { NotificationResponse } from './notificationApi';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 알림 종류별 분류 라벨. 목록에서 무슨 알림인지 한눈에 보이게 붙입니다. */
const TYPE_LABELS: Record<PushNotificationType, string> = {
  SAVED_PLACE_STATUS_CHANGE: '저장한 장소',
  SAVED_PLACE_NEARBY_OBSTACLE: '주변 장애물',
  MY_REPORT_CONFIRMED: '내 제보',
  MY_REPORT_CONFIRMATION_REQUESTED: '확인 요청',
  NEARBY_HELP_REQUEST: '도움 요청',
  MY_HELP_REQUEST_ACCEPTED: '도움 요청',
};

export function toNotificationTypeLabel(type: PushNotificationType): string {
  return TYPE_LABELS[type] ?? '알림';
}

/**
 * 받은 지 얼마나 됐는지. 「방금 전」 「32분 전」 「3시간 전」 「2일 전」
 *
 * <p>목록에서 중요한 건 정확한 시각이 아니라 "얼마나 최근인지"라서 상대 시간으로 적습니다.
 */
export function formatNotificationTime(createdAt: string, now: number = Date.now()): string {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) {
    return '';
  }

  const elapsed = Math.max(0, now - parsed);
  if (elapsed < MINUTE_MS) {
    return '방금 전';
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)}분 전`;
  }
  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}시간 전`;
  }
  if (elapsed < 7 * DAY_MS) {
    return `${Math.floor(elapsed / DAY_MS)}일 전`;
  }

  const date = new Date(parsed);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 배지 문구. 99를 넘으면 「99+」로 줄입니다. */
export function toUnreadBadge(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count > 99 ? '99+' : String(count);
}

/** 목록 항목이 열 화면이 있는지. route가 없는 알림은 눌러도 이동하지 않습니다. */
export function isOpenable(notification: NotificationResponse): boolean {
  return typeof notification.route === 'string' && notification.route.length > 0;
}

/** 알림 payload를 푸시와 같은 모양으로 만듭니다 — 이동 규칙(toPushTarget)을 한 벌만 유지하기 위해서입니다. */
export function toPushPayload(notification: NotificationResponse): Record<string, unknown> {
  return {
    type: notification.type,
    route: notification.route ?? undefined,
    ...(notification.placeId !== null ? { placeId: notification.placeId } : {}),
    ...(notification.reportId !== null ? { id: notification.reportId } : {}),
    ...(notification.helpRequestId !== null ? { helpRequestId: notification.helpRequestId } : {}),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
