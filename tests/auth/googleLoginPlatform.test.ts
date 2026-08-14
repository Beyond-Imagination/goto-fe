import assert from 'node:assert/strict';
import test from 'node:test';

import { supportsGoogleNativeLogin } from '@/auth/social/googleLoginPlatform';

test('구글 네이티브 로그인은 Android와 iOS에서 지원한다', () => {
  assert.equal(supportsGoogleNativeLogin('android'), true);
  assert.equal(supportsGoogleNativeLogin('ios'), true);
});

test('구글 네이티브 로그인은 웹에서 지원하지 않는다', () => {
  assert.equal(supportsGoogleNativeLogin('web'), false);
});
