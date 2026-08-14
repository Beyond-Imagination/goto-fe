import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProfilePhotoUnderDevelopmentAlertConfig,
  PROFILE_PHOTO_ALERT_TITLE,
  PROFILE_PHOTO_UNDER_DEVELOPMENT_MESSAGE,
} from '@/auth/signup/profilePhoto';

test('프로필 사진 개발 중 안내 메시지 상수가 올바르게 정의되어 있다', () => {
  assert.equal(PROFILE_PHOTO_UNDER_DEVELOPMENT_MESSAGE, '현재 개발 중인 기능입니다.');
  assert.equal(PROFILE_PHOTO_ALERT_TITLE, '안내');
});

test('getProfilePhotoUnderDevelopmentAlertConfig는 Android/iOS Alert에 필요한 설정을 제공한다', () => {
  const config = getProfilePhotoUnderDevelopmentAlertConfig();

  assert.equal(config.title, '안내');
  assert.equal(config.message, '현재 개발 중인 기능입니다.');
  assert.equal(config.buttonText, '확인');
  assert.equal(config.cancelable, true);
});
