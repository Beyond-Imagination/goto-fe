import type { NotificationApi, NotificationPage, NotificationResponse } from './notificationApi';

/** mock 모드에서 알림 목록 화면을 확인할 수 있도록 채워둔 알림들 (최신순). */
const SEED: readonly NotificationResponse[] = [
  {
    id: 9001,
    type: 'SAVED_PLACE_STATUS_CHANGE',
    title: '저장한 장소에 새 소식이 있어요',
    body: '서울숲 공원 · 일부 불편했어요',
    route: '/(tabs)/saved',
    placeId: 3311,
    reportId: null,
    helpRequestId: null,
    read: false,
    createdAt: minutesAgo(12),
  },
  {
    id: 9000,
    type: 'SAVED_PLACE_NEARBY_OBSTACLE',
    title: '국립중앙박물관 근처에 새 장애물 제보',
    body: '보도 파손 · 통행 주의',
    route: '/report/detail',
    placeId: null,
    reportId: 1247,
    helpRequestId: null,
    read: false,
    createdAt: hoursAgo(5),
  },
  {
    id: 8999,
    type: 'MY_REPORT_CONFIRMED',
    title: '내 제보가 확인됐어요',
    body: '계단 제보를 3명이 확인했어요',
    route: '/report/detail',
    placeId: null,
    reportId: 1183,
    helpRequestId: null,
    read: true,
    createdAt: daysAgo(2),
  },
  {
    id: 8998,
    type: 'MY_REPORT_CONFIRMATION_REQUESTED',
    title: '이 제보, 지금도 그대로인가요?',
    body: '높은 턱 제보를 확인한 지 45일이 지났어요',
    route: '/report/detail',
    placeId: null,
    reportId: 1092,
    helpRequestId: null,
    read: true,
    createdAt: daysAgo(9),
  },
];

/** 화면을 다시 열어도 읽음 상태가 남아야 하므로 모듈 수준에 둡니다. */
let store: NotificationResponse[] = SEED.map(item => ({ ...item }));

export function resetMockNotificationStore(): void {
  store = SEED.map(item => ({ ...item }));
}

export function createMockNotificationApi(): NotificationApi {
  return {
    async findPage(query = {}) {
      const size = query.size ?? 20;
      // 커서는 "이 id 다음부터"라는 뜻으로만 씁니다(실서버는 시각+id를 인코딩합니다).
      const startIndex = query.cursor
        ? store.findIndex(item => String(item.id) === query.cursor) + 1
        : 0;
      const items = store.slice(startIndex, startIndex + size);
      const hasNext = startIndex + size < store.length;

      return {
        items: items.map(item => ({ ...item })),
        nextCursor: hasNext && items.length > 0 ? String(items[items.length - 1].id) : null,
        unreadCount: countUnread(),
      } satisfies NotificationPage;
    },

    async countUnread() {
      return countUnread();
    },

    async markRead(notificationId: number) {
      store = store.map(item => (item.id === notificationId ? { ...item, read: true } : item));
    },

    async markAllRead() {
      store = store.map(item => ({ ...item, read: true }));
    },
  };
}

function countUnread(): number {
  return store.filter(item => !item.read).length;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return minutesAgo(hours * 60);
}

function daysAgo(days: number): string {
  return minutesAgo(days * 60 * 24);
}
