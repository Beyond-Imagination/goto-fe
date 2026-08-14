import assert from 'node:assert/strict';
import test from 'node:test';

import { createRefreshTokenStore, REFRESH_TOKEN_STORAGE_KEY } from '@/auth/session/refreshTokenStore';

test('refresh token은 전용 SecureStore 키로만 읽고 쓰고 지운다', async () => {
  // Given: SecureStore에 저장된 refresh token이 있다.
  const calls: [string, ...string[]][] = [];
  const store = createRefreshTokenStore({
    getItem: async (key) => {
      calls.push(['get', key]);
      return 'stored-refresh-token';
    },
    setItem: async (key, value) => {
      calls.push(['set', key, value]);
    },
    deleteItem: async (key) => {
      calls.push(['delete', key]);
    },
  });

  // When: 읽고, 새 토큰을 쓰고, 지운다.
  assert.equal(await store.read(), 'stored-refresh-token');
  await store.write('next-refresh-token');
  await store.clear();

  // Then: 모든 호출이 전용 키만 사용한다.
  assert.deepEqual(calls, [
    ['get', REFRESH_TOKEN_STORAGE_KEY],
    ['set', REFRESH_TOKEN_STORAGE_KEY, 'next-refresh-token'],
    ['delete', REFRESH_TOKEN_STORAGE_KEY],
  ]);
});
