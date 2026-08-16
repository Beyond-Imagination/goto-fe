import assert from 'node:assert/strict';
import test from 'node:test';

import { OAuthLoginCancelledError, OAuthProviderConfigurationError } from '@/auth/common';
import { createGoogleLoginAdapter, type GoogleLoginConfig } from '@/auth/social/googleLoginAdapter';

const validConfig: GoogleLoginConfig = {
  webClientId: 'google-web-client-id.apps.googleusercontent.com',
  iosClientId: 'google-ios-client-id.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
};

test('구글 로그인을 두 번 해도 SDK는 한 번만 configure되고 access token이 공통 credential이 된다', async () => {
  // Given: Config와 구글 SDK가 준비되어 있다.
  const configuredConfigs: GoogleLoginConfig[] = [];
  const playServicesOptions: unknown[] = [];

  const adapter = createGoogleLoginAdapter(
    validConfig,
    (config) => {
      configuredConfigs.push(config);
    },
    async (options) => {
      playServicesOptions.push(options);
      return true;
    },
    async () => ({ type: 'success' }),
    async () => ({ accessToken: 'google-access-token', idToken: 'google-id-token' }),
  );

  // When: 로그인을 두 번 호출한다.
  assert.deepEqual(await adapter.login(), {
    provider: 'GOOGLE',
    providerAccessToken: 'google-access-token',
  });
  await adapter.login();

  // Then: SDK는 한 번만 configure되고 showPlayServicesUpdateDialog: true로 Play Services를 확인한다.
  assert.deepEqual(configuredConfigs, [validConfig]);
  assert.deepEqual(playServicesOptions, [
    { showPlayServicesUpdateDialog: true },
    { showPlayServicesUpdateDialog: true },
  ]);
});

test('사용자가 구글 로그인을 취소(SIGN_IN_CANCELLED / 12501)하면 치명적이지 않은 취소 에러가 된다', async () => {
  // Given: Android SIGN_IN_CANCELLED (code: 12501)
  const adapterWithCode12501 = createGoogleLoginAdapter(
    validConfig,
    () => undefined,
    async () => true,
    async () => Promise.reject({ code: '12501', message: 'Sign in cancelled' }),
    async () => ({ accessToken: 'token' }),
  );

  await assert.rejects(adapterWithCode12501.login(), OAuthLoginCancelledError);

  // Given: SIGN_IN_CANCELLED string code
  const adapterWithStringCode = createGoogleLoginAdapter(
    validConfig,
    () => undefined,
    async () => true,
    async () => Promise.reject({ code: 'SIGN_IN_CANCELLED' }),
    async () => ({ accessToken: 'token' }),
  );

  await assert.rejects(adapterWithStringCode.login(), OAuthLoginCancelledError);

  // Given: cancel text in message
  const adapterWithMessage = createGoogleLoginAdapter(
    validConfig,
    () => undefined,
    async () => true,
    async () => Promise.reject(new Error('User cancelled the sign in flow')),
    async () => ({ accessToken: 'token' }),
  );

  await assert.rejects(adapterWithMessage.login(), OAuthLoginCancelledError);
});

test('Web Client ID와 iOS Client ID가 모두 없으면 SDK를 호출하지 않고 설정 오류를 낸다', async () => {
  // Given: Client ID가 둘 다 비어 있다.
  const adapter = createGoogleLoginAdapter(
    { webClientId: '', iosClientId: '' },
    () => undefined,
    async () => true,
    async () => ({ type: 'success' }),
    async () => ({ accessToken: 'unused' }),
  );

  // When & Then: SDK 호출 전에 OAuthProviderConfigurationError가 발생한다.
  await assert.rejects(adapter.login(), OAuthProviderConfigurationError);
});

test('구글 토큰 조회에서 access token이 누락되면 에러를 던진다', async () => {
  // Given: getTokens가 빈 access token을 반환한다.
  const adapter = createGoogleLoginAdapter(
    validConfig,
    () => undefined,
    async () => true,
    async () => ({ type: 'success' }),
    async () => ({ accessToken: '' }),
  );

  // When & Then: 적절한 예외가 발생한다.
  await assert.rejects(adapter.login(), /구글 access token을 받지 못했습니다/);
});

test('Google Play Services 또는 SDK 에러 발생 시 원본 에러를 전파한다', async () => {
  // Given: hasPlayServices가 실패한다.
  const adapter = createGoogleLoginAdapter(
    validConfig,
    () => undefined,
    async () => Promise.reject(new Error('Play Services is not available')),
    async () => ({ type: 'success' }),
    async () => ({ accessToken: 'token' }),
  );

  // When & Then: 에러가 그대로 전파된다.
  await assert.rejects(adapter.login(), /Play Services is not available/);
});
