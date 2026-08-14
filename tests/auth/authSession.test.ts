import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  AUTH_ERROR_CODE,
  AUTH_STATUS,
  OAUTH_LOGIN_STATUS,
  AuthApiError,
  OAuthLoginCancelledError,
  OAuthProviderUnavailableError,
  type OAuthLoginResponse,
  type OAuthSignupDetails,
  type OAuthSignupPreferences,
  type PlatformSession,
  type ProviderCredential,
} from '@/auth/common';
import { createAuthSession } from '@/auth/session/authSession';
import type { SocialLoginAdapter } from '@/auth/social/socialLoginAdapter';
import { toPlatformSession, type OAuthApi } from '@/auth/social/oauthApi';
import { REFRESH_TOKEN_STORAGE_KEY, type KeyValueStorage } from '@/auth/session/refreshTokenStore';

const kakaoCredential: ProviderCredential = {
  provider: 'KAKAO',
  providerAccessToken: 'kakao-access-token',
};

const signupDetails: OAuthSignupDetails = {
  nickname: '함께가길',
  agreementMask: 15,
};

const signupPreferences: OAuthSignupPreferences = {
  mobilityModes: ['WHEELCHAIR'],
  informationPreferences: {
    priorityFacilities: ['ELEVATOR'],
    avoidConditions: ['STAIRS'],
  },
};

const platformTokens = {
  accessToken: 'platform-access-token',
  refreshToken: 'platform-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 300,
};

const signupRequiredLogin: OAuthLoginResponse = {
  status: OAUTH_LOGIN_STATUS.signupRequired,
  provider: 'KAKAO',
  suggestedNickname: '카카오닉네임',
};

function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));

  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    deleteItem: async (key) => {
      values.delete(key);
    },
  };
}

function unusedApi(): OAuthApi {
  const fail = async () => {
    throw new Error('이 테스트에서 호출되면 안 되는 API입니다.');
  };

  return {
    isNicknameAvailable: fail,
    oauthLogin: fail,
    oauthSignup: fail,
    refreshPlatformSession: fail,
  };
}

function kakaoAdapter(login: SocialLoginAdapter['login'] = async () => kakaoCredential): SocialLoginAdapter {
  return { login };
}

function createSession(overrides: {
  api?: Partial<OAuthApi>;
  adapter?: SocialLoginAdapter;
  storage?: KeyValueStorage;
} = {}) {
  return createAuthSession({
    api: { ...unusedApi(), ...overrides.api },
    getSocialLoginAdapter: (provider) => {
      if (provider !== 'kakao') {
        throw new OAuthProviderUnavailableError();
      }

      return overrides.adapter ?? kakaoAdapter();
    },
    storage: overrides.storage ?? createMemoryStorage(),
  });
}

async function restoreUnauthenticated(overrides: Parameters<typeof createSession>[0] = {}) {
  const auth = createSession(overrides);
  await auth.restoreSession();
  return auth;
}

async function reachSignupRequired(overrides: Parameters<typeof createSession>[0] = {}) {
  const auth = await restoreUnauthenticated({
    ...overrides,
    api: {
      oauthLogin: async () => signupRequiredLogin,
      ...overrides.api,
    },
  });
  await auth.beginSocialLogin('kakao');
  auth.saveSignupDetails(signupDetails);
  return auth;
}

function assertSession(session: PlatformSession | null) {
  assert.ok(session);
  assert.equal(session.accessToken, platformTokens.accessToken);
  assert.equal(session.tokenType, platformTokens.tokenType);
  assert.equal(session.expiresIn, platformTokens.expiresIn);
  assert.ok(session.expiresAt > Date.now());
}

describe('세션 복원', () => {
  test('저장된 refresh token이 없으면 비로그인 상태가 된다', async () => {
    const auth = createSession();

    await auth.restoreSession();

    assert.deepEqual(auth.getSnapshot(), {
      status: AUTH_STATUS.unauthenticated,
      session: null,
      pendingSignup: null,
      restoreError: null,
    });
  });

  test('저장된 refresh token으로 복원에 성공하면 로그인 상태가 된다', async () => {
    const storage = createMemoryStorage({
      [REFRESH_TOKEN_STORAGE_KEY]: 'stored-refresh-token',
    });
    let refreshedWith: string | undefined;
    const auth = createSession({
      storage,
      api: {
        refreshPlatformSession: async (refreshToken) => {
          refreshedWith = refreshToken;
          return toPlatformSession(platformTokens);
        },
      },
    });

    await auth.restoreSession();

    assert.equal(refreshedWith, 'stored-refresh-token');
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.authenticated);
    assertSession(auth.getSnapshot().session);
  });

  test('refresh가 401이면 저장된 토큰을 지우고 비로그인 상태가 된다', async () => {
    const storage = createMemoryStorage({
      [REFRESH_TOKEN_STORAGE_KEY]: 'expired-refresh-token',
    });
    const auth = createSession({
      storage,
      api: {
        refreshPlatformSession: async () => {
          throw new AuthApiError(401, 'INVALID_REFRESH_TOKEN', '리프레시 토큰이 만료되었습니다.');
        },
      },
    });

    await auth.restoreSession();

    assert.equal(storage.values.has(REFRESH_TOKEN_STORAGE_KEY), false);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
    assert.equal(auth.getSnapshot().session, null);
  });

  test('세션 복원 중 네트워크 오류가 나면 복원 실패 상태가 된다', async () => {
    const auth = createSession({
      storage: createMemoryStorage({
        [REFRESH_TOKEN_STORAGE_KEY]: 'stored-refresh-token',
      }),
      api: {
        refreshPlatformSession: async () => {
          throw new Error('network down');
        },
      },
    });

    await auth.restoreSession();

    assert.equal(auth.getSnapshot().status, AUTH_STATUS.restore_failed);
    assert.equal(auth.getSnapshot().restoreError?.message, 'network down');
  });

  test('복원 실패 후 다시 시도하면 로그인 상태로 돌아온다', async () => {
    let shouldFail = true;
    const auth = createSession({
      storage: createMemoryStorage({
        [REFRESH_TOKEN_STORAGE_KEY]: 'stored-refresh-token',
      }),
      api: {
        refreshPlatformSession: async () => {
          if (shouldFail) {
            throw new Error('network down');
          }

          return toPlatformSession(platformTokens);
        },
      },
    });

    await auth.restoreSession();
    shouldFail = false;
    await auth.restoreSession();

    assert.equal(auth.getSnapshot().status, AUTH_STATUS.authenticated);
    assert.equal(auth.getSnapshot().restoreError, null);
    assertSession(auth.getSnapshot().session);
  });
});

describe('소셜 로그인', () => {
  test('기존 회원이면 refresh token을 저장하고 로그인 상태가 된다', async () => {
    const storage = createMemoryStorage();
    const auth = await restoreUnauthenticated({
      storage,
      api: {
        oauthLogin: async (credential) => {
          assert.deepEqual(credential, kakaoCredential);
          return { status: OAUTH_LOGIN_STATUS.authenticated, ...platformTokens };
        },
      },
    });

    const outcome = await auth.beginSocialLogin('kakao');

    assert.equal(outcome.type, AUTH_STATUS.authenticated);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.authenticated);
    assert.equal(storage.values.get(REFRESH_TOKEN_STORAGE_KEY), platformTokens.refreshToken);
    assert.equal(auth.getSnapshot().pendingSignup, null);
    assertSession(auth.getSnapshot().session);
  });

  test('신규 회원이면 가입 대기 상태가 되고 추천 닉네임을 남긴다', async () => {
    const auth = await restoreUnauthenticated({
      api: {
        oauthLogin: async () => signupRequiredLogin,
      },
    });

    const outcome = await auth.beginSocialLogin('kakao');

    assert.equal(outcome.type, AUTH_STATUS.signup_required);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.signup_required);
    assert.deepEqual(auth.getSnapshot().pendingSignup, {
      ...kakaoCredential,
      provider: 'KAKAO',
      suggestedNickname: '카카오닉네임',
    });
    assert.equal(auth.getSnapshot().session, null);
  });

  test('카카오 로그인을 취소하면 에러를 다시 던지고 비로그인 상태가 된다', async () => {
    const auth = await restoreUnauthenticated({
      adapter: kakaoAdapter(async () => {
        throw new OAuthLoginCancelledError();
      }),
    });

    await assert.rejects(auth.beginSocialLogin('kakao'), OAuthLoginCancelledError);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
  });

  test('카카오 로그인 실패 시 비로그인 상태로 돌아가고 에러를 다시 던진다', async () => {
    const auth = await restoreUnauthenticated({
      adapter: kakaoAdapter(async () => {
        throw new Error('kakao sdk failed');
      }),
    });

    await assert.rejects(auth.beginSocialLogin('kakao'), /kakao sdk failed/);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
  });

  test('아직 준비되지 않은 소셜 로그인은 비로그인 상태를 유지한다', async () => {
    const auth = await restoreUnauthenticated();

    await assert.rejects(auth.beginSocialLogin('naver'), OAuthProviderUnavailableError);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
  });
});

describe('회원가입', () => {
  test('가입 정보를 저장하면 pendingSignup에 닉네임과 약관 마스크가 붙는다', async () => {
    const auth = await restoreUnauthenticated({
      api: {
        oauthLogin: async () => signupRequiredLogin,
      },
    });
    await auth.beginSocialLogin('kakao');

    auth.saveSignupDetails(signupDetails);

    assert.deepEqual(auth.getSnapshot().pendingSignup?.details, signupDetails);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.signup_required);
  });

  test('가입 정보가 없는데 가입을 완료하면 실패하고 상태는 바뀌지 않는다', async () => {
    const auth = await restoreUnauthenticated();

    await assert.rejects(auth.completeOAuthSignup(signupPreferences), /회원가입 정보를 다시 입력해주세요/);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
  });

  test('회원가입이 성공하면 세션을 저장하고 로그인 상태가 된다', async () => {
    const storage = createMemoryStorage();
    let signupRequest: unknown;
    const auth = await reachSignupRequired({
      storage,
      api: {
        oauthSignup: async (request) => {
          signupRequest = request;
          return {
            session: toPlatformSession(platformTokens),
            refreshToken: platformTokens.refreshToken,
          };
        },
      },
    });

    const session = await auth.completeOAuthSignup(signupPreferences);

    assert.deepEqual(signupRequest, {
      ...kakaoCredential,
      ...signupDetails,
      preferences: signupPreferences,
    });
    assertSession(session);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.authenticated);
    assert.equal(auth.getSnapshot().pendingSignup, null);
    assert.equal(storage.values.get(REFRESH_TOKEN_STORAGE_KEY), platformTokens.refreshToken);
  });

  test('이미 가입이 끝난 계정이면 login으로 세션을 복구한다', async () => {
    const storage = createMemoryStorage();
    const loginResponses: OAuthLoginResponse[] = [
      signupRequiredLogin,
      { status: OAUTH_LOGIN_STATUS.authenticated, ...platformTokens },
    ];
    const auth = await reachSignupRequired({
      storage,
      api: {
        oauthLogin: async () => {
          const response = loginResponses.shift();
          assert.ok(response, '예상하지 못한 추가 oauthLogin 호출');
          return response;
        },
        oauthSignup: async () => {
          throw new AuthApiError(409, AUTH_ERROR_CODE.signupAlreadyCompleted, '이미 가입이 완료된 계정입니다.');
        },
      },
    });

    const session = await auth.completeOAuthSignup(signupPreferences);

    assertSession(session);
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.authenticated);
    assert.equal(storage.values.get(REFRESH_TOKEN_STORAGE_KEY), platformTokens.refreshToken);
  });

  test('이미 가입된 계정인데 login이 다시 가입을 요구하면 가입 대기로 남긴다', async () => {
    const auth = await reachSignupRequired({
      api: {
        oauthLogin: async () => signupRequiredLogin,
        oauthSignup: async () => {
          throw new AuthApiError(409, AUTH_ERROR_CODE.signupAlreadyCompleted, '이미 가입이 완료된 계정입니다.');
        },
      },
    });

    await assert.rejects(
      auth.completeOAuthSignup(signupPreferences),
      (error: unknown) => {
        assert.ok(error instanceof AuthApiError);
        assert.equal(error.errorCode, AUTH_ERROR_CODE.signupAlreadyCompleted);
        return true;
      },
    );
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.signup_required);
    assert.ok(auth.getSnapshot().pendingSignup);
  });

  test('가입 중 OAuth 토큰이 만료되면 가입 대기를 지우고 비로그인 상태가 된다', async () => {
    const auth = await reachSignupRequired({
      api: {
        oauthSignup: async () => {
          throw new AuthApiError(401, AUTH_ERROR_CODE.invalidOAuthToken, '유효하지 않거나 만료된 OAuth access token입니다.');
        },
      },
    });

    await assert.rejects(
      auth.completeOAuthSignup(signupPreferences),
      (error: unknown) => {
        assert.ok(error instanceof AuthApiError);
        assert.equal(error.errorCode, AUTH_ERROR_CODE.invalidOAuthToken);
        return true;
      },
    );
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
    assert.equal(auth.getSnapshot().pendingSignup, null);
  });

  test('가입 중 닉네임이 중복이면 가입 대기 상태로 되돌린다', async () => {
    const auth = await reachSignupRequired({
      api: {
        oauthSignup: async () => {
          throw new AuthApiError(409, AUTH_ERROR_CODE.nicknameAlreadyInUse, '이미 사용 중인 닉네임입니다.');
        },
      },
    });

    await assert.rejects(
      auth.completeOAuthSignup(signupPreferences),
      (error: unknown) => {
        assert.ok(error instanceof AuthApiError);
        assert.equal(error.errorCode, AUTH_ERROR_CODE.nicknameAlreadyInUse);
        return true;
      },
    );
    assert.equal(auth.getSnapshot().status, AUTH_STATUS.signup_required);
    assert.deepEqual(auth.getSnapshot().pendingSignup?.details, signupDetails);
  });

  test('가입을 취소하면 대기 정보를 지우고 비로그인 상태가 된다', async () => {
    const auth = await reachSignupRequired();

    auth.cancelSignup();

    assert.equal(auth.getSnapshot().status, AUTH_STATUS.unauthenticated);
    assert.equal(auth.getSnapshot().pendingSignup, null);
  });

  test('세션을 지우면 저장된 refresh token과 로그인 상태가 함께 사라진다', async () => {
    const storage = createMemoryStorage();
    const auth = await restoreUnauthenticated({
      storage,
      api: {
        oauthLogin: async () => ({ status: OAUTH_LOGIN_STATUS.authenticated, ...platformTokens }),
      },
    });
    await auth.beginSocialLogin('kakao');

    await auth.clearSession();

    assert.equal(storage.values.has(REFRESH_TOKEN_STORAGE_KEY), false);
    assert.deepEqual(auth.getSnapshot(), {
      status: AUTH_STATUS.unauthenticated,
      session: null,
      pendingSignup: null,
      restoreError: null,
    });
  });
});
