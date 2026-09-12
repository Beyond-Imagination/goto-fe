import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  createMockNotificationApi,
  resetMockNotificationStore,
} from '@/notifications/mockNotificationApi';
import { createNotificationApi, NotificationApiError } from '@/notifications/notificationApi';

type Call = Readonly<{ url: string; method: string; authorization: string | null }>;

function stubFetch(status: number, payload: unknown, calls: Call[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input as string, init);
    calls.push({
      url: request.url,
      method: request.method,
      authorization: request.headers.get('Authorization'),
    });

    if (status === 204) {
      return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const BASE_URL = 'https://api.example.test';

function createApi(status: number, payload: unknown, calls: Call[]) {
  return createNotificationApi({
    apiBaseUrl: BASE_URL,
    getAccessToken: () => 'test-token',
    fetchImplementation: stubFetch(status, payload, calls),
  });
}

describe('notificationApi', () => {
  it('목록은 GET으로 커서와 개수를 쿼리에 담는다', async () => {
    const calls: Call[] = [];
    const api = createApi(200, { items: [], nextCursor: null, unreadCount: 0 }, calls);

    await api.findPage({ cursor: 'MTc1NzMwMDAwMDowOjEy', size: 20 });

    assert.equal(
      calls[0].url,
      `${BASE_URL}/api/v1/members/me/notifications?cursor=MTc1NzMwMDAwMDowOjEy&size=20`,
    );
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].authorization, 'Bearer test-token');
  });

  it('커서가 없으면 쿼리 없이 첫 페이지를 부른다', async () => {
    const calls: Call[] = [];
    const api = createApi(200, { items: [], nextCursor: null, unreadCount: 0 }, calls);

    await api.findPage();

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/notifications`);
  });

  it('안 읽은 수는 count만 꺼내 돌려준다', async () => {
    const calls: Call[] = [];
    const api = createApi(200, { count: 4 }, calls);

    const count = await api.countUnread();

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/notifications/unread-count`);
    assert.equal(count, 4);
  });

  it('읽음 처리는 PATCH 두 경로를 쓴다', async () => {
    const calls: Call[] = [];
    const api = createApi(204, null, calls);

    await api.markRead(12);
    await api.markAllRead();

    assert.equal(calls[0].url, `${BASE_URL}/api/v1/members/me/notifications/12/read`);
    assert.equal(calls[0].method, 'PATCH');
    assert.equal(calls[1].url, `${BASE_URL}/api/v1/members/me/notifications/read`);
    assert.equal(calls[1].method, 'PATCH');
  });

  it('깨진 커서 오류는 errorCode를 담은 NotificationApiError가 된다', async () => {
    const calls: Call[] = [];
    const api = createApi(
      400,
      { errorCode: 'INVALID_NOTIFICATION_CURSOR', errorMessage: '잘못된 알림 커서입니다.' },
      calls,
    );

    await assert.rejects(
      () => api.findPage({ cursor: 'broken' }),
      (error: unknown) => {
        assert.ok(error instanceof NotificationApiError);
        assert.equal(error.status, 400);
        assert.equal(error.errorCode, 'INVALID_NOTIFICATION_CURSOR');
        return true;
      },
    );
  });
});

describe('mockNotificationApi', () => {
  beforeEach(() => {
    resetMockNotificationStore();
  });

  it('최신순으로 돌려주고 안 읽은 수를 함께 준다', async () => {
    const page = await createMockNotificationApi().findPage();

    const descending = page.items.every(
      (item, index) =>
        index === 0 || Date.parse(page.items[index - 1].createdAt) >= Date.parse(item.createdAt),
    );

    assert.ok(page.items.length > 0);
    assert.ok(descending);
    assert.equal(page.unreadCount, page.items.filter(item => !item.read).length);
  });

  it('커서로 이어 읽으면 겹치지 않는다', async () => {
    const api = createMockNotificationApi();

    const first = await api.findPage({ size: 2 });
    const second = await api.findPage({ cursor: first.nextCursor, size: 2 });

    assert.equal(first.items.length, 2);
    assert.equal(second.items.length, 2);
    assert.equal(
      first.items.some(item => second.items.some(other => other.id === item.id)),
      false,
    );
    assert.equal(second.nextCursor, null);
  });

  it('읽음 처리는 어댑터를 새로 만들어도 남는다', async () => {
    const api = createMockNotificationApi();
    const [first] = (await api.findPage()).items;

    await api.markRead(first.id);

    const reopened = await createMockNotificationApi().findPage();
    assert.equal(reopened.items.find(item => item.id === first.id)?.read, true);
  });

  it('모두 읽음 처리하면 안 읽은 수가 0이 된다', async () => {
    const api = createMockNotificationApi();

    await api.markAllRead();

    assert.equal(await api.countUnread(), 0);
    assert.equal((await api.findPage()).items.every(item => item.read), true);
  });
});
