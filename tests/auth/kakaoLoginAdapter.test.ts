import assert from 'node:assert/strict';
import test from 'node:test';

import { OAuthLoginCancelledError, OAuthProviderConfigurationError } from '@/auth/common';
import { createKakaoLoginAdapter } from '@/auth/social/kakaoLoginAdapter';

test('카카오 로그인을 두 번 해도 SDK는 한 번만 초기화되고 토큰이 공통 credential이 된다', async () => {
  // Given: Native App Key와 카카오 SDK가 준비되어 있다.
  const initializedWith: string[] = [];
  const adapter = createKakaoLoginAdapter(
    'native-app-key',
    async (key) => {
      initializedWith.push(key);
    },
    async () => ({ accessToken: 'kakao-access-token' }),
  );

  // When: 로그인을 두 번 호출한다.
  assert.deepEqual(await adapter.login(), {
    provider: 'KAKAO',
    providerAccessToken: 'kakao-access-token',
  });
  await adapter.login();

  // Then: SDK는 한 번만 초기화되고 access token이 providerAccessToken이 된다.
  assert.deepEqual(initializedWith, ['native-app-key']);
});

test('사용자가 카카오 로그인을 취소하면 치명적이지 않은 취소 에러가 된다', async () => {
  // Given: 카카오 SDK가 CANCELLED를 반환한다.
  const adapter = createKakaoLoginAdapter(
    'native-app-key',
    () => undefined,
    async () => Promise.reject({ code: 'CANCELLED' }),
  );

  // When: 로그인을 호출한다.
  // Then: OAuthLoginCancelledError가 발생한다.
  await assert.rejects(adapter.login(), OAuthLoginCancelledError);
});

test('Native App Key가 없으면 SDK를 호출하지 않고 설정 오류를 낸다', async () => {
  // Given: Native App Key가 비어 있다.
  const adapter = createKakaoLoginAdapter('', () => undefined, async () => ({ accessToken: 'unused' }));

  // When: 로그인을 호출한다.
  // Then: SDK 로그인 전에 OAuthProviderConfigurationError가 발생한다.
  await assert.rejects(adapter.login(), OAuthProviderConfigurationError);
});
