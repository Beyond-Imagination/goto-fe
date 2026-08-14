import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type {
  OAuthLoginOutcome,
  OAuthSignupDetails,
  OAuthSignupPreferences,
  PlatformSession,
} from '@/auth/common';
import { type SocialProvider } from '@/components/auth/socialProviders';

import { createAuthSession, type AuthSnapshot } from './authSession';
import { createMockKakaoAdapter, createMockNaverAdapter, createMockOAuthApi } from '@/mock';
import { isNicknameAvailable, oauthLogin, oauthSignup, refreshPlatformSession } from '../social/oauthApi';
import { type KeyValueStorage } from './refreshTokenStore';
import { getSocialLoginAdapter } from '../social/socialLogin';

type AuthContextValue = AuthSnapshot & {
  beginSocialLogin: (provider: SocialProvider) => Promise<OAuthLoginOutcome>;
  saveSignupDetails: (details: OAuthSignupDetails) => void;
  completeOAuthSignup: (preferences: OAuthSignupPreferences) => Promise<PlatformSession>;
  retryRestore: () => Promise<void>;
  cancelSignup: () => void;
  clearSession: () => Promise<void>;
  isNicknameAvailable: (nickname: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const nativeSecureStorage: KeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

// 웹에는 SecureStore가 없고, refresh token을 브라우저에 두지 않는다. 세션 복원은 네이티브만 지원한다.
const webNoopStorage: KeyValueStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  deleteItem: async () => undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const isMockMode = process.env.EXPO_PUBLIC_AUTH_MODE === 'mock';

  const authSession = useMemo(() => {
    if (isMockMode) {
      const mockKakaoAdapter = createMockKakaoAdapter();
      const mockNaverAdapter = createMockNaverAdapter();
      return createAuthSession({
        api: createMockOAuthApi(),
        getSocialLoginAdapter: (provider) => (provider === 'naver' ? mockNaverAdapter : mockKakaoAdapter),
        storage: Platform.OS === 'web' ? webNoopStorage : nativeSecureStorage,
      });
    }

    return createAuthSession({
      api: {
        isNicknameAvailable,
        oauthLogin,
        oauthSignup,
        refreshPlatformSession,
      },
      getSocialLoginAdapter,
      storage: Platform.OS === 'web' ? webNoopStorage : nativeSecureStorage,
    });
  }, [isMockMode]);

  const snapshot = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot, authSession.getSnapshot);

  useEffect(() => {
    const timer = setTimeout(() => {
      void authSession.restoreSession();
    }, 0);

    return () => clearTimeout(timer);
  }, [authSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      beginSocialLogin: authSession.beginSocialLogin,
      saveSignupDetails: authSession.saveSignupDetails,
      completeOAuthSignup: authSession.completeOAuthSignup,
      retryRestore: authSession.restoreSession,
      cancelSignup: authSession.cancelSignup,
      clearSession: authSession.clearSession,
      isNicknameAvailable: authSession.isNicknameAvailable,
    }),
    [authSession, snapshot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
