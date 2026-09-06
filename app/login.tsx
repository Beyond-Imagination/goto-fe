import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import {
  AUTH_STATUS,
  OAuthLoginCancelledError,
  getLoginUserErrorMessage,
  useAuth,
} from '@/auth';
import { type SocialProvider } from '@/components/auth';
import { LoginScreen } from '@/screens/LoginScreen';
import { logger } from '@/utils/logger';

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
      router.replace(outcome.type === AUTH_STATUS.authenticated ? '/(tabs)' : '/signup/terms');
    } catch (error) {
      if (error instanceof OAuthLoginCancelledError) {
        return;
      }

      logger.error(`[LoginRoute] ${provider} login error:`, error);
      setErrorMessage(getLoginUserErrorMessage(error, provider));
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

