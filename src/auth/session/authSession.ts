/**
 * 로그인 상태 머신.
 *
 * React 밖에 두어 API·소셜 로그인·스토리지를 주입한 채 전이만 검증할 수 있게 한다.
 * AuthProvider는 이 세션을 구독하는 래퍼이고, 화면 라우팅은 포함하지 않는다.
 */
import { type SocialProvider } from '@/components/auth/socialProviders';

import {
  AUTH_ERROR_CODE,
  AUTH_STATUS,
  OAUTH_LOGIN_STATUS,
  AuthApiError,
  type AuthStatus,
  type OAuthLoginOutcome,
  type OAuthSignupDetails,
  type OAuthSignupPreferences,
  type PendingOAuthSignup,
  type PlatformSession,
} from '@/auth/common';
import type { SocialLoginAdapter } from '../social/socialLoginAdapter';
import { toPlatformSession, type OAuthApi } from '../social/oauthApi';
import { createRefreshTokenStore, type KeyValueStorage } from './refreshTokenStore';

export type AuthSessionDeps = {
  api: OAuthApi;
  getSocialLoginAdapter: (provider: SocialProvider) => SocialLoginAdapter;
  storage: KeyValueStorage;
};

export type AuthSnapshot = {
  status: AuthStatus;
  session: PlatformSession | null;
  pendingSignup: PendingOAuthSignup | null;
  restoreError: Error | null;
};

export type AuthSession = {
  getSnapshot(): AuthSnapshot;
  subscribe(listener: () => void): () => void;
  restoreSession(): Promise<void>;
  beginSocialLogin(provider: SocialProvider): Promise<OAuthLoginOutcome>;
  saveSignupDetails(details: OAuthSignupDetails): void;
  completeOAuthSignup(preferences: OAuthSignupPreferences): Promise<PlatformSession>;
  cancelSignup(): void;
  clearSession(): Promise<void>;
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof AuthApiError && error.status === 401;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('세션을 복원하지 못했습니다.');
}

export function createAuthSession(deps: AuthSessionDeps): AuthSession {
  const refreshTokenStore = createRefreshTokenStore(deps.storage);
  const listeners = new Set<() => void>();
  let snapshot: AuthSnapshot = {
    status: AUTH_STATUS.restoring,
    session: null,
    pendingSignup: null,
    restoreError: null,
  };

  function emit(patch: Partial<AuthSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function establishSession(nextSession: PlatformSession, refreshToken: string) {
    await refreshTokenStore.write(refreshToken);
    emit({
      session: nextSession,
      pendingSignup: null,
      status: AUTH_STATUS.authenticated,
    });
  }

  async function restoreSession() {
    emit({ status: AUTH_STATUS.restoring, restoreError: null });

    try {
      const refreshToken = await refreshTokenStore.read();

      if (!refreshToken) {
        emit({ session: null, status: AUTH_STATUS.unauthenticated });
        return;
      }

      const nextSession = await deps.api.refreshPlatformSession(refreshToken);
      emit({ session: nextSession, status: AUTH_STATUS.authenticated });
    } catch (error) {
      // 만료된 refresh token은 재시도해도 실패하므로 지운다.
      // 네트워크 오류는 토큰을 남겨 두고 restore_failed로 재시도한다.
      if (isUnauthorized(error)) {
        await refreshTokenStore.clear();
        emit({ session: null, status: AUTH_STATUS.unauthenticated });
        return;
      }

      emit({ restoreError: toError(error), status: AUTH_STATUS.restore_failed });
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    restoreSession,
    async beginSocialLogin(provider) {
      emit({ status: AUTH_STATUS.signing_in });

      try {
        const credential = await deps.getSocialLoginAdapter(provider).login();
        const response = await deps.api.oauthLogin(credential);

        if (response.status === OAUTH_LOGIN_STATUS.authenticated) {
          const nextSession = toPlatformSession(response);
          await establishSession(nextSession, response.refreshToken);
          return { type: AUTH_STATUS.authenticated, session: nextSession };
        }

        const nextPendingSignup: PendingOAuthSignup = {
          ...credential,
          provider: response.provider,
          suggestedNickname: response.suggestedNickname,
        };
        emit({ pendingSignup: nextPendingSignup, status: AUTH_STATUS.signup_required });
        return { type: AUTH_STATUS.signup_required, pendingSignup: nextPendingSignup };
      } catch (error) {
        // 취소·실패 모두 signing_in에 머물면 안 된다. 에러 문구는 화면이 정한다.
        emit({ status: AUTH_STATUS.unauthenticated });
        throw error;
      }
    },
    saveSignupDetails(details) {
      if (!snapshot.pendingSignup) {
        return;
      }

      emit({ pendingSignup: { ...snapshot.pendingSignup, details } });
    },
    async completeOAuthSignup(preferences) {
      const pendingSignup = snapshot.pendingSignup;

      if (!pendingSignup?.details) {
        throw new Error('회원가입 정보를 다시 입력해주세요.');
      }

      emit({ status: AUTH_STATUS.signing_up });

      try {
        const { session: nextSession, refreshToken } = await deps.api.oauthSignup({
          provider: pendingSignup.provider,
          providerAccessToken: pendingSignup.providerAccessToken,
          ...pendingSignup.details,
          preferences,
        });
        await establishSession(nextSession, refreshToken);
        return nextSession;
      } catch (error) {
        // 가입이 이미 끝난 계정(재시도·레이스)은 signup 대신 login으로 세션을 복구한다.
        if (error instanceof AuthApiError && error.errorCode === AUTH_ERROR_CODE.signupAlreadyCompleted) {
          const response = await deps.api.oauthLogin(pendingSignup);

          if (response.status === OAUTH_LOGIN_STATUS.authenticated) {
            const nextSession = toPlatformSession(response);
            await establishSession(nextSession, response.refreshToken);
            return nextSession;
          }
        }

        if (error instanceof AuthApiError && error.errorCode === AUTH_ERROR_CODE.invalidOAuthToken) {
          // 카카오 토큰이 만료되면 같은 pending으로는 재가입할 수 없다.
          emit({ pendingSignup: null, status: AUTH_STATUS.unauthenticated });
        } else {
          // 닉네임 중복 등은 입력만 고치면 되므로 가입 대기를 유지한다.
          emit({ status: AUTH_STATUS.signup_required });
        }
        throw error;
      }
    },
    cancelSignup() {
      emit({ pendingSignup: null, status: AUTH_STATUS.unauthenticated });
    },
    async clearSession() {
      await refreshTokenStore.clear();
      emit({
        session: null,
        pendingSignup: null,
        restoreError: null,
        status: AUTH_STATUS.unauthenticated,
      });
    },
  };
}
