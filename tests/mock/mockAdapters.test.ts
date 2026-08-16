import assert from 'node:assert/strict';
import test from 'node:test';

import { OAUTH_LOGIN_STATUS, AuthApiError } from '@/auth/common';
import { createMockGoogleAdapter, createMockKakaoAdapter, createMockNaverAdapter, createMockOAuthApi, createMockTermsApi } from '@/mock/adapters';
import { MOCK_TERMS_LIST, MOCK_TERMS_MAP } from '@/mock/data/mockTerms';
import { NICKNAME_FIXTURES } from '@/mock/fixtures';
import { NEW_SIGNUP_USER, WHEELCHAIR_USER, NICKNAME_CONFLICT_USER } from '@/mock/personas';

test('mockKakaoAdapter는 페르소나 기반 가상 토큰을 발급한다', async () => {
  const adapter = createMockKakaoAdapter({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const credential = await adapter.login();

  assert.equal(credential.provider, 'KAKAO');
  assert.ok(credential.providerAccessToken.includes('new_signup_user'));
});

test('mockNaverAdapter는 페르소나 기반 가상 토큰을 발급한다', async () => {
  const adapter = createMockNaverAdapter({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const credential = await adapter.login();

  assert.equal(credential.provider, 'NAVER');
  assert.ok(credential.providerAccessToken.includes('new_signup_user'));
});

test('mockGoogleAdapter는 페르소나 기반 가상 토큰을 발급한다', async () => {
  const adapter = createMockGoogleAdapter({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const credential = await adapter.login();

  assert.equal(credential.provider, 'GOOGLE');
  assert.ok(credential.providerAccessToken.includes('new_signup_user'));
});

test('mockOAuthApi는 신규 가입자 페르소나에게 SIGN_UP_REQUIRED를 응답한다', async () => {
  const api = createMockOAuthApi({ persona: NEW_SIGNUP_USER, simulatedDelayMs: 0 });
  const response = await api.oauthLogin({ provider: 'KAKAO', providerAccessToken: 'test-token' });

  assert.equal(response.status, OAUTH_LOGIN_STATUS.signupRequired);
  if (response.status === OAUTH_LOGIN_STATUS.signupRequired) {
    assert.equal(response.suggestedNickname, NICKNAME_FIXTURES.suggested);
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

  assert.equal(await api.isNicknameAvailable(NICKNAME_FIXTURES.available), true);
  for (const unavailable of NICKNAME_FIXTURES.unavailable) {
    assert.equal(await api.isNicknameAvailable(unavailable), false);
  }
});

test('mockOAuthApi는 커스텀 unavailableNicknames fixture 주입을 지원한다', async () => {
  const api = createMockOAuthApi({
    unavailableNicknames: ['커스텀중복닉네임'],
    simulatedDelayMs: 0,
  });

  assert.equal(await api.isNicknameAvailable('커스텀중복닉네임'), false);
  assert.equal(await api.isNicknameAvailable('이미있는닉네임'), true);
});

test('mockOAuthApi는 닉네임 충돌 유저의 가입 완료 시 409 에러를 던진다', async () => {
  const api = createMockOAuthApi({ persona: NICKNAME_CONFLICT_USER, simulatedDelayMs: 0 });

  await assert.rejects(
    api.oauthSignup({
      provider: 'KAKAO',
      providerAccessToken: 'token',
      agreementMask: 15,
      nickname: NICKNAME_FIXTURES.conflict,
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

test('mockTermsApi는 백엔드 DTO 규격에 일치하는 약관 목록을 반환한다', async () => {
  const api = createMockTermsApi({ simulatedDelayMs: 0 });
  const result = await api.getTerms();

  assert.strictEqual(result.terms.length, MOCK_TERMS_LIST.length);
  assert.strictEqual(result.terms[0]?.id, 'age');
  assert.strictEqual(result.terms[1]?.id, 'terms');
  assert.strictEqual(result.terms[1]?.title, '서비스 이용약관');
  assert.ok(result.terms[1]?.sections.length > 0);
});

test('mockTermsApi는 특정 약관 단건 조회를 정상 반환하고 미등록 ID는 404 에러를 던진다', async () => {
  const api = createMockTermsApi({ simulatedDelayMs: 0 });
  const term = await api.getTerm('location');

  assert.strictEqual(term.id, 'location');
  assert.strictEqual(term.title, '위치기반서비스 이용약관');

  await assert.rejects(
    async () => {
      await api.getTerm('unknown_id');
    },
    /404/,
  );
});
