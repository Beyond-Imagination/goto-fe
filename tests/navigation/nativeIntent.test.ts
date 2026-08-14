import assert from 'node:assert/strict';
import test from 'node:test';

import { redirectSystemPath } from '@/../app/+native-intent';

test('네이버 로그인 콜백 URL은 Expo Router에서 라우팅하지 않고 무시(null)한다', () => {
  const result = redirectSystemPath({
    path: '/thirdPartyLoginResult?version=2&code=test_code&state=test_state',
    initial: false,
  });

  assert.equal(result, null);
});

test('일반 딥링크 경로는 그대로 반환하여 정상 라우팅되도록 한다', () => {
  const result = redirectSystemPath({
    path: '/profile/edit',
    initial: false,
  });

  assert.equal(result, '/profile/edit');
});
