import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { NotificationApi } from '@/notifications/notificationApi';
import {
  startUnreadNotificationCountLoad,
  toVisibleUnreadCount,
} from '@/notifications/unreadNotificationCount';

function api(countUnread: () => Promise<number>): NotificationApi {
  return {
    findPage: async () => ({ items: [], nextCursor: null, unreadCount: 0 }),
    countUnread,
    markRead: async () => undefined,
    markAllRead: async () => undefined,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });
  return { promise, resolve, reject };
}

describe('toVisibleUnreadCount', () => {
  it('0 이하는 배지를 숨긴다', () => {
    assert.equal(toVisibleUnreadCount(0), null);
    assert.equal(toVisibleUnreadCount(-3), null);
  });

  it('양수는 그대로 보여준다', () => {
    assert.equal(toVisibleUnreadCount(4), 4);
    assert.equal(toVisibleUnreadCount(1.7), 1);
    assert.equal(toVisibleUnreadCount(Number.NaN), null);
  });
});

describe('startUnreadNotificationCountLoad', () => {
  it('조회 전에 이전 숫자를 지운 뒤 결과를 전달한다', async () => {
    const pending = deferred<number>();
    const counts: (number | null)[] = [];

    startUnreadNotificationCountLoad(
      api(() => pending.promise),
      count => counts.push(count),
    );

    assert.deepEqual(counts, [null]);
    pending.resolve(3);
    await pending.promise;
    await Promise.resolve();

    assert.deepEqual(counts, [null, 3]);
  });

  it('화면을 벗어난 뒤 도착한 결과는 버린다', async () => {
    const pending = deferred<number>();
    const counts: (number | null)[] = [];

    const stop = startUnreadNotificationCountLoad(
      api(() => pending.promise),
      count => counts.push(count),
    );
    stop();

    pending.resolve(5);
    await pending.promise;
    await Promise.resolve();

    assert.deepEqual(counts, [null]);
  });

  it('실패하면 배지를 조용히 숨긴다', async () => {
    const counts: (number | null)[] = [];

    startUnreadNotificationCountLoad(
      api(() => Promise.reject(new Error('network'))),
      count => counts.push(count),
    );
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(counts, [null, null]);
  });

  it('API가 없으면 배지를 숨긴 채로 둔다', () => {
    const counts: (number | null)[] = [];

    startUnreadNotificationCountLoad(null, count => counts.push(count));

    assert.deepEqual(counts, [null]);
  });
});
