import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import {
  AUTH_STATUS,
  AuthApiError,
  OAuthLoginCancelledError,
  OAuthProviderUnavailableError,
  useAuth,
} from '@/auth';
import { type SocialProvider } from '@/components/auth';
import { LoginScreen } from '@/screens/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const { beginSocialLogin, session } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleProviderPress(provider: SocialProvider) {
    setLoadingProvider(provider);
    setErrorMessage(null);

    try {
      const outcome = await beginSocialLogin(provider);
      router.replace(outcome.type === AUTH_STATUS.authenticated ? '/(tabs)' : '/signup/account');
    } catch (error) {
      if (error instanceof OAuthLoginCancelledError) {
        return;
      }

      setErrorMessage(getLoginErrorMessage(error, provider));
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <LoginScreen
      errorMessage={errorMessage}
      loadingProvider={loadingProvider}
      onProviderPress={(provider) => void handleProviderPress(provider)}
    />
  );
}

function getLoginErrorMessage(error: unknown, provider: SocialProvider): string {
  if (error instanceof OAuthProviderUnavailableError) {
    const label = provider === 'naver' ? '네이버' : provider === 'google' ? '구글' : '웹';
    return `${label} 로그인은 준비 중입니다.`;
  }

  if (error instanceof AuthApiError) {
    return error.message;
  }

  return '로그인을 완료하지 못했어요. 다시 시도해주세요.';
}
