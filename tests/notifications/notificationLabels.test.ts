import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NotificationResponse } from '@/notifications/notificationApi';
import {
  formatNotificationTime,
  isOpenable,
  toNotificationTypeLabel,
  toPushPayload,
  toUnreadBadge,
} from '@/notifications/notificationLabels';

const NOW = Date.parse('2026-09-12T12:00:00Z');

function notification(overrides: Partial<NotificationResponse> = {}): NotificationResponse {
  return {
    id: 1,
    type: 'SAVED_PLACE_STATUS_CHANGE',
    title: '저장한 장소에 새 소식이 있어요',
    body: '국립중앙박물관 · 일부 불편했어요',
    route: '/(tabs)/saved',
    placeId: 4102,
    reportId: null,
    helpRequestId: null,
    read: false,
    createdAt: '2026-09-12T11:00:00Z',
    ...overrides,
  };
}

describe('formatNotificationTime', () => {
  it('1분 안쪽은 「방금 전」이다', () => {
    assert.equal(formatNotificationTime('2026-09-12T11:59:30Z', NOW), '방금 전');
  });

  it('한 시간 안쪽은 분, 하루 안쪽은 시간으로 적는다', () => {
    assert.equal(formatNotificationTime('2026-09-12T11:28:00Z', NOW), '32분 전');
    assert.equal(formatNotificationTime('2026-09-12T07:00:00Z', NOW), '5시간 전');
  });

  it('일주일 안쪽은 며칠 전, 그보다 오래되면 날짜로 적는다', () => {
    assert.equal(formatNotificationTime('2026-09-10T12:00:00Z', NOW), '2일 전');
    assert.equal(formatNotificationTime('2026-08-30T12:00:00Z', NOW), '2026.08.30');
  });

  it('미래 시각(시계 차이)은 「방금 전」으로 떨어진다', () => {
    assert.equal(formatNotificationTime('2026-09-12T12:05:00Z', NOW), '방금 전');
  });

  it('읽을 수 없는 시각은 빈 문자열이다', () => {
    assert.equal(formatNotificationTime('not-a-date', NOW), '');
  });
});

describe('toUnreadBadge', () => {
  it('0 이하는 배지를 숨긴다', () => {
    assert.equal(toUnreadBadge(0), null);
    assert.equal(toUnreadBadge(-1), null);
  });

  it('99를 넘으면 99+로 줄인다', () => {
    assert.equal(toUnreadBadge(3), '3');
    assert.equal(toUnreadBadge(99), '99');
    assert.equal(toUnreadBadge(100), '99+');
  });
});

describe('toNotificationTypeLabel', () => {
  it('종류마다 분류 라벨을 붙인다', () => {
    assert.equal(toNotificationTypeLabel('SAVED_PLACE_STATUS_CHANGE'), '저장한 장소');
    assert.equal(toNotificationTypeLabel('SAVED_PLACE_NEARBY_OBSTACLE'), '주변 장애물');
    assert.equal(toNotificationTypeLabel('MY_REPORT_CONFIRMATION_REQUESTED'), '확인 요청');
    assert.equal(toNotificationTypeLabel('NEARBY_HELP_REQUEST'), '도움 요청');
  });
});

describe('isOpenable', () => {
  it('route가 있어야 누를 수 있다', () => {
    assert.equal(isOpenable(notification()), true);
    assert.equal(isOpenable(notification({ route: null })), false);
    assert.equal(isOpenable(notification({ route: '' })), false);
  });
});

describe('toPushPayload', () => {
  it('푸시와 같은 모양으로 바꿔 이동 규칙을 한 벌만 쓴다', () => {
    assert.deepEqual(toPushPayload(notification()), {
      type: 'SAVED_PLACE_STATUS_CHANGE',
      route: '/(tabs)/saved',
      placeId: 4102,
    });
  });

  it('제보 알림은 reportId를 푸시와 같은 키(id)로 옮긴다', () => {
    assert.deepEqual(
      toPushPayload(
        notification({ type: 'MY_REPORT_CONFIRMED', route: '/report/detail', placeId: null, reportId: 77 }),
      ),
      { type: 'MY_REPORT_CONFIRMED', route: '/report/detail', id: 77 },
    );
  });

  it('도움 요청 알림은 helpRequestId를 넘긴다', () => {
    const payload = toPushPayload(
      notification({
        type: 'MY_HELP_REQUEST_ACCEPTED',
        route: '/help/request-pending',
        placeId: null,
        helpRequestId: '0198f0a2-0000-7000-8000-000000000000',
      }),
    );

    assert.equal(payload.helpRequestId, '0198f0a2-0000-7000-8000-000000000000');
  });

  it('route가 없으면 undefined로 남아 이동 대상이 되지 않는다', () => {
    assert.equal(toPushPayload(notification({ route: null })).route, undefined);
  });
});
