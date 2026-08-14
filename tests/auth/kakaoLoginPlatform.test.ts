import assert from 'node:assert/strict';
import test from 'node:test';

import { supportsKakaoNativeLogin } from '@/auth/social/kakaoLoginPlatform';

test('카카오 네이티브 로그인은 Android와 iOS에서 지원한다', () => {
  assert.equal(supportsKakaoNativeLogin('android'), true);
  assert.equal(supportsKakaoNativeLogin('ios'), true);
});

test('카카오 네이티브 로그인은 웹에서 지원하지 않는다', () => {
  assert.equal(supportsKakaoNativeLogin('web'), false);
});
