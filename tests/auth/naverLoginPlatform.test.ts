import assert from 'node:assert/strict';
import test from 'node:test';

import { supportsNaverNativeLogin } from '@/auth/social/naverLoginPlatform';

test('네이버 네이티브 로그인은 Android와 iOS에서 지원한다', () => {
  assert.equal(supportsNaverNativeLogin('android'), true);
  assert.equal(supportsNaverNativeLogin('ios'), true);
});

test('네이버 네이티브 로그인은 웹에서 지원하지 않는다', () => {
  assert.equal(supportsNaverNativeLogin('web'), false);
});
