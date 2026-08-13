import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { AUTH_STATUS } from '@/auth/common';
import { getInitialRoute } from '@/navigation/initialRoute';

describe('초기 라우팅', () => {
  test('세션 복구에 실패하면 스플래시 완료 여부와 관계없이 로그인으로 보낸다', () => {
    assert.equal(getInitialRoute(AUTH_STATUS.restore_failed, false, false), '/login');
    assert.equal(getInitialRoute(AUTH_STATUS.restore_failed, false, true), '/login');
  });

  test('세션을 복원하는 중이거나 스플래시가 끝나지 않았으면 스플래시를 유지한다', () => {
    assert.equal(getInitialRoute(AUTH_STATUS.restoring, false, true), null);
    assert.equal(getInitialRoute(AUTH_STATUS.unauthenticated, false, false), null);
  });

  test('세션 복원 후에는 인증 상태에 맞는 화면으로 보낸다', () => {
    assert.equal(getInitialRoute(AUTH_STATUS.authenticated, true, true), '/(tabs)');
    assert.equal(getInitialRoute(AUTH_STATUS.unauthenticated, false, true), '/login');
  });
});
