import assert from 'node:assert/strict';
import test from 'node:test';

import { OAUTH_LOGIN_STATUS, AuthApiError } from '@/auth/common';
import { createMockKakaoAdapter, createMockOAuthApi } from '@/mock/adapters';
import { NEW_SIGNUP_USER, WHEELCHAIR_USER, NICKNAME_CONFLICT_USER } from '@/mock/personas';

test('mockKakaoAdapter는 페르소나 기반 가상 토큰을 발급한다', async () => {
  const adapter = createMockKakaoAdapter({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const credential = await adapter.login();

  assert.equal(credential.provider, 'KAKAO');
  assert.ok(credential.providerAccessToken.includes('new_signup_user'));
});

test('mockOAuthApi는 신규 가입자 페르소나에게 SIGN_UP_REQUIRED를 응답한다', async () => {
  const api = createMockOAuthApi({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const response = await api.oauthLogin({ provider: 'KAKAO', providerAccessToken: 'test-token' });

  assert.equal(response.status, OAUTH_LOGIN_STATUS.signupRequired);
  if (response.status === OAUTH_LOGIN_STATUS.signupRequired) {
    assert.equal(response.suggestedNickname, '함께가길');
  }
});

test('mockOAuthApi는 기가입자(WHEELCHAIR_USER)에게 AUTHENTICATED를 응답한다', async () => {
  const api = createMockOAuthApi({ persona: WHEELCHAIR_USER, simulatedDelayMs: 0 });
  const response = await api.oauthLogin({ provider: 'KAKAO', providerAccessToken: 'test-token' });

  assert.equal(response.status, OAUTH_LOGIN_STATUS.authenticated);
  if (response.status === OAUTH_LOGIN_STATUS.authenticated) {
    assert.ok(response.accessToken.length > 0);
  }
});

test('mockOAuthApi는 닉네임 중복 여부를 정상 검증한다', async () => {
  const api = createMockOAuthApi({ simulatedDelayMs: 0 });

  assert.equal(await api.isNicknameAvailable('새로운닉네임'), true);
  assert.equal(await api.isNicknameAvailable('이미있는닉네임'), false);
  assert.equal(await api.isNicknameAvailable('중복닉네임'), false);
});

test('mockOAuthApi는 닉네임 충돌 유저의 가입 완료 시 409 에러를 던진다', async () => {
  const api = createMockOAuthApi({ persona: NICKNAME_CONFLICT_USER, simulatedDelayMs: 0 });

  await assert.rejects(
    api.oauthSignup({
      provider: 'KAKAO',
      providerAccessToken: 'token',
      agreementMask: 15,
      nickname: '이미있는닉네임',
      preferences: {
        mobilityModes: ['WHEELCHAIR'],
        informationPreferences: {
          priorityFacilities: ['ELEVATOR'],
          avoidConditions: ['STAIRS'],
        },
      },
    }),
    (error: unknown) => error instanceof AuthApiError && error.status === 409,
  );
});
