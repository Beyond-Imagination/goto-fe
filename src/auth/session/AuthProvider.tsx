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
import { DEFAULT_DEV_PERSONA } from '@/mock/devUserPresets';
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

const DEV_MOCK_SNAPSHOT: Partial<AuthSnapshot> = {
  session: DEFAULT_DEV_PERSONA.auth.session,
  pendingSignup: DEFAULT_DEV_PERSONA.auth.pendingSignup,
  status: DEFAULT_DEV_PERSONA.auth.status,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const authSession = useMemo(
    () => createAuthSession({
      api: {
        isNicknameAvailable,
        oauthLogin,
        oauthSignup,
        refreshPlatformSession,
      },
      getSocialLoginAdapter,
      storage: Platform.OS === 'web' ? webNoopStorage : nativeSecureStorage,
      initialSnapshot: typeof __DEV__ !== 'undefined' && __DEV__ ? DEV_MOCK_SNAPSHOT : undefined,
    }),
    [],
  );
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
