import assert from 'node:assert/strict';
import test from 'node:test';

import { OAuthLoginCancelledError, OAuthProviderConfigurationError } from '@/auth/common';
import { createNaverLoginAdapter, type NaverLoginConfig } from '@/auth/social/naverLoginAdapter';

const validConfig: NaverLoginConfig = {
  consumerKey: 'naver-client-id',
  consumerSecret: 'naver-client-secret',
  appName: '함께가길',
  serviceUrlSchemeIOS: 'goto',
};

test('네이버 로그인을 두 번 해도 SDK는 한 번만 초기화되고 토큰이 공통 credential이 된다', async () => {
  // Given: Config와 네이버 SDK가 준비되어 있다.
  const initializedConfigs: NaverLoginConfig[] = [];
  const adapter = createNaverLoginAdapter(
    validConfig,
    async (config) => {
      initializedConfigs.push(config);
    },
    async () => ({
      isSuccess: true,
      successResponse: {
        accessToken: 'naver-access-token',
        refreshToken: 'naver-refresh-token',
        expiresIn: '3600',
        tokenType: 'Bearer',
      },
    }),
  );

  // When: 로그인을 두 번 호출한다.
  assert.deepEqual(await adapter.login(), {
    provider: 'NAVER',
    providerAccessToken: 'naver-access-token',
  });
  await adapter.login();

  // Then: SDK는 한 번만 초기화되고 access token이 providerAccessToken이 된다.
  assert.deepEqual(initializedConfigs, [validConfig]);
});

test('사용자가 네이버 로그인을 취소(failureResponse.isCancel)하면 치명적이지 않은 취소 에러가 된다', async () => {
  // Given: 네이버 SDK가 isCancel=true를 반환한다.
  const adapter = createNaverLoginAdapter(
    validConfig,
    () => undefined,
    async () => ({
      isSuccess: false,
      failureResponse: {
        isCancel: true,
        errorCode: 'user_cancel',
        errorMessage: 'User cancelled login',
      },
    }),
  );

  // When & Then: OAuthLoginCancelledError가 발생한다.
  await assert.rejects(adapter.login(), OAuthLoginCancelledError);
});

test('네이버 SDK 호출 중 에러가 던져지고 취소 메시지가 포함되어 있으면 취소 에러로 정규화된다', async () => {
  // Given: 네이버 SDK가 CANCELLED 에러를 throw한다.
  const adapter = createNaverLoginAdapter(
    validConfig,
    () => undefined,
    async () => Promise.reject({ errorCode: 'CANCELED_BY_USER' }),
  );

  // When & Then: OAuthLoginCancelledError가 발생한다.
  await assert.rejects(adapter.login(), OAuthLoginCancelledError);
});

test('Consumer Key 또는 Secret이 없으면 SDK를 호출하지 않고 설정 오류를 낸다', async () => {
  // Given: Consumer Key가 비어 있다.
  const adapterWithoutKey = createNaverLoginAdapter(
    { ...validConfig, consumerKey: '' },
    () => undefined,
    async () => ({ isSuccess: true }),
  );

  // When & Then: SDK 로그인 전에 OAuthProviderConfigurationError가 발생한다.
  await assert.rejects(adapterWithoutKey.login(), OAuthProviderConfigurationError);

  // Given: Consumer Secret이 비어 있다.
  const adapterWithoutSecret = createNaverLoginAdapter(
    { ...validConfig, consumerSecret: '' },
    () => undefined,
    async () => ({ isSuccess: true }),
  );

  // When & Then: SDK 로그인 전에 OAuthProviderConfigurationError가 발생한다.
  await assert.rejects(adapterWithoutSecret.login(), OAuthProviderConfigurationError);
});

test('네이버 로그인 실패 시 failureResponse의 에러 메시지를 포함한 일반 에러를 발생시킨다', async () => {
  // Given: SDK가 실패 응답을 반환한다.
  const adapter = createNaverLoginAdapter(
    validConfig,
    () => undefined,
    async () => ({
      isSuccess: false,
      failureResponse: {
        isCancel: false,
        errorMessage: '네트워크 연결 상태를 확인해주세요.',
      },
    }),
  );

  // When & Then: 에러 메시지가 유지된다.
  await assert.rejects(adapter.login(), /네트워크 연결 상태를 확인해주세요/);
});
