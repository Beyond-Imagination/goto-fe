import assert from 'node:assert/strict';
import test from 'node:test';

import { startPendingHelpRequestCountLoad } from '@/help/pendingHelpRequestCount';
import type { PendingHelpRequestApi } from '@/help/pendingHelpRequestApi';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

function createDeferredApi(pending: ReturnType<typeof deferred<number>>): PendingHelpRequestApi {
  return {
    getPendingCount: () => pending.promise,
  };
}

test('포커스 시 이전 건수를 지운 뒤 조회한 양수 건수를 반영한다', async () => {
  const pending = deferred<number>();
  const counts: Array<number | null> = [];

  startPendingHelpRequestCountLoad(createDeferredApi(pending), (count) => {
    counts.push(count);
  });

  assert.deepEqual(counts, [null]);

  pending.resolve(2);
  await pending.promise;

  assert.deepEqual(counts, [null, 2]);
});

test('다시 포커스되면 이전 숫자를 지우고 최신 건수를 반영한다', async () => {
  const first = deferred<number>();
  const second = deferred<number>();
  const counts: Array<number | null> = [];
  const onCount = (count: number | null) => {
    counts.push(count);
  };

  const stopFirst = startPendingHelpRequestCountLoad(createDeferredApi(first), onCount);
  first.resolve(2);
  await first.promise;
  stopFirst();

  startPendingHelpRequestCountLoad(createDeferredApi(second), onCount);
  assert.equal(counts.at(-1), null);

  second.resolve(5);
  await second.promise;

  assert.deepEqual(counts, [null, 2, null, 5]);
});

test('포커스를 잃으면 이전 요청 결과는 버린다', async () => {
  const stale = deferred<number>();
  const latest = deferred<number>();
  const counts: Array<number | null> = [];
  const onCount = (count: number | null) => {
    counts.push(count);
  };

  const stopStale = startPendingHelpRequestCountLoad(createDeferredApi(stale), onCount);
  stopStale();

  startPendingHelpRequestCountLoad(createDeferredApi(latest), onCount);
  stale.resolve(2);
  await stale.promise;
  latest.resolve(5);
  await latest.promise;

  assert.deepEqual(counts, [null, null, 5]);
});

test('API가 없으면 배지를 숨긴 채로 유지한다', () => {
  const counts: Array<number | null> = [];

  startPendingHelpRequestCountLoad(null, (count) => {
    counts.push(count);
  });

  assert.deepEqual(counts, [null]);
});

test('조회 실패나 잘못된 건수는 배지를 숨긴다', async () => {
  const invalid = deferred<number>();
  const failed = deferred<number>();
  const invalidCounts: Array<number | null> = [];
  const failedCounts: Array<number | null> = [];

  startPendingHelpRequestCountLoad(createDeferredApi(invalid), (count) => {
    invalidCounts.push(count);
  });
  invalid.resolve(0);
  await invalid.promise;

  startPendingHelpRequestCountLoad(createDeferredApi(failed), (count) => {
    failedCounts.push(count);
  });
  failed.reject(new Error('unavailable'));
  await failed.promise.catch(() => undefined);

  assert.deepEqual(invalidCounts, [null, null]);
  assert.deepEqual(failedCounts, [null, null]);
});
