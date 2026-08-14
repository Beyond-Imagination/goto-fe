import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loginAccessNotice,
  loginHeadline,
  SOCIAL_PROVIDERS,
  SOCIAL_PROVIDER_LABELS,
} from '@/components/auth/socialProviders';

test('social provider list contains only the supported providers when login choices render', () => {
  // Given: the set of social choices displayed on the login screen.
  const expectedProviders = ['kakao', 'naver', 'google'];

  // When: the login screen reads its provider list.
  const actualProviders = [...SOCIAL_PROVIDERS];

  // Then: Apple and every unsupported provider remain absent.
  assert.deepEqual(actualProviders, expectedProviders);
});

test('login screen uses the Figma call to action labels and access notice', () => {
  // Given: the three supported provider buttons on the Figma login screen.
  const expectedLabels = ['카카오로 시작하기', '네이버로 시작하기', '구글로 시작하기'];

  // When: the login screen reads its visible content.
  const actualLabels = SOCIAL_PROVIDERS.map((provider) => SOCIAL_PROVIDER_LABELS[provider]);

  // Then: the current navigation goal and login-required notice are presented.
  assert.deepEqual(actualLabels, expectedLabels);
  assert.equal(loginHeadline, '오늘 갈 수 있는 길을\n함께 확인해요');
  assert.equal(loginAccessNotice, '제보와 도움 요청은 로그인이 필요해요');
});
