import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_ERROR_CODE, OAUTH_LOGIN_STATUS } from '@/auth/common/constants';
import { AuthApiError } from '@/auth/common/errors';
import { createOAuthApi } from '@/auth/social/oauthApi';

test('닉네임 사용 가능 여부는 URL 인코딩된 REST 조회로 확인한다', async () => {
  let request: { method?: string; url: string } | null = null;
  const api = createOAuthApi('https://api.example.test', async (input, init) => {
    request = { method: init?.method, url: String(input) };
    return Response.json({ available: true });
  });

  const available = await api.isNicknameAvailable('함께 가길');

  assert.equal(available, true);
  assert.deepEqual(request, {
    method: undefined,
    url: 'https://api.example.test/api/v1/nicknames/%ED%95%A8%EA%BB%98%20%EA%B0%80%EA%B8%B8/availability',
  });
});

test('oauth/login은 백엔드 계약을 보내고 AUTHENTICATED 응답을 돌려준다', async () => {
  // Given: 백엔드가 AUTHENTICATED 토큰을 반환한다.
  let request: { url: string; body: unknown } | null = null;
  const api = createOAuthApi('https://api.example.test', async (input, init) => {
    request = {
      url: String(input),
      body: JSON.parse(String(init?.body)),
    };

    return Response.json({
      status: OAUTH_LOGIN_STATUS.authenticated,
      accessToken: 'platform-access-token',
      refreshToken: 'platform-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 300,
    });
  });

  // When: 카카오 provider access token으로 로그인한다.
  const response = await api.oauthLogin({
    provider: 'KAKAO',
    providerAccessToken: 'kakao-access-token',
  });

  // Then: /api/v1/auth/oauth/login에 계약대로 전송되고 AUTHENTICATED를 받는다.
  assert.deepEqual(request, {
    url: 'https://api.example.test/api/v1/auth/oauth/login',
    body: {
      provider: 'KAKAO',
      providerAccessToken: 'kakao-access-token',
    },
  });
  assert.equal(response.status, OAUTH_LOGIN_STATUS.authenticated);
});

test('oauth API는 응답 바디를 그대로 넘기지 않고 백엔드 에러 코드만 노출한다', async () => {
  // Given: 백엔드가 401 INVALID_OAUTH_TOKEN을 반환한다.
  const api = createOAuthApi('https://api.example.test', async () => new Response(
    JSON.stringify({
      errorCode: AUTH_ERROR_CODE.invalidOAuthToken,
      errorMessage: '유효하지 않거나 만료된 OAuth access token입니다.',
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  ));

  // When: 만료된 토큰으로 로그인한다.
  // Then: AuthApiError에 status와 errorCode, 메시지만 담긴다.
  await assert.rejects(
    api.oauthLogin({ provider: 'KAKAO', providerAccessToken: 'expired-token' }),
    (error: unknown) => {
      assert.ok(error instanceof AuthApiError);
      assert.equal(error.status, 401);
      assert.equal(error.errorCode, AUTH_ERROR_CODE.invalidOAuthToken);
      assert.equal(error.message, '유효하지 않거나 만료된 OAuth access token입니다.');
      return true;
    },
  );
});

test('oauth/signup은 약관 마스크와 매핑된 선호 설정을 그대로 직렬화한다', async () => {
  // Given: 닉네임, 약관 마스크, 이동/시설 선호가 있다.
  let body: unknown;
  const api = createOAuthApi('https://api.example.test', async (_input, init) => {
    body = JSON.parse(String(init?.body));

    return Response.json({
      status: OAUTH_LOGIN_STATUS.authenticated,
      accessToken: 'platform-access-token',
      refreshToken: 'platform-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 300,
    });
  });

  // When: 회원가입을 요청한다.
  const result = await api.oauthSignup({
    provider: 'KAKAO',
    providerAccessToken: 'kakao-access-token',
    nickname: '함께가길',
    agreementMask: 15,
    preferences: {
      mobilityModes: ['WHEELCHAIR'],
      informationPreferences: {
        priorityFacilities: ['ELEVATOR'],
        avoidConditions: ['STAIRS'],
      },
    },
  });

  // Then: 요청 body가 백엔드 계약과 같고 refresh token을 받는다.
  assert.equal(result.refreshToken, 'platform-refresh-token');
  assert.deepEqual(body, {
    provider: 'KAKAO',
    providerAccessToken: 'kakao-access-token',
    nickname: '함께가길',
    agreementMask: 15,
    preferences: {
      mobilityModes: ['WHEELCHAIR'],
      informationPreferences: {
        priorityFacilities: ['ELEVATOR'],
        avoidConditions: ['STAIRS'],
      },
    },
  });
});
