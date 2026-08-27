import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMockPendingHelpRequestApi,
  getPendingHelpRequestApi,
  toVisiblePendingCount,
} from '@/help/pendingHelpRequestApi';

test('mock pending 도움 요청 API는 지정한 건수를 비동기로 반환한다', async () => {
  const api = createMockPendingHelpRequestApi(2);

  assert.equal(await api.getPendingCount(), 2);
});

test('pending 도움 요청 API는 인증 mock 모드에서만 제공한다', () => {
  assert.ok(getPendingHelpRequestApi('mock'));
  assert.equal(getPendingHelpRequestApi('live'), null);
});

test('배지는 양수인 안전한 정수만 표시한다', () => {
  assert.equal(toVisiblePendingCount(2), 2);
  assert.equal(toVisiblePendingCount(0), null);
  assert.equal(toVisiblePendingCount(-1), null);
  assert.equal(toVisiblePendingCount(1.5), null);
});
