import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  AUTH_ERROR_CODE,
  AuthApiError,
  getSignupUserErrorMessage,
  toOAuthSignupPreferences,
  useAuth,
} from '@/auth';
import { SignupCompleteScreen } from '@/screens/SignupCompleteScreen';
import { useProfile } from '@/state/profile';

export default function SignupCompleteRoute() {
  const router = useRouter();
  const { completeOAuthSignup } = useAuth();
  const { profile } = useProfile();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<unknown | null>(null);

  const submit = useCallback(async () => {
    setError(null);

    try {
      await completeOAuthSignup(toOAuthSignupPreferences(profile));
      router.replace('/profile/done');
    } catch (nextError) {
      if (nextError instanceof AuthApiError && nextError.errorCode === AUTH_ERROR_CODE.nicknameAlreadyInUse) {
        router.replace('/signup/account?error=nickname');
        return;
      }

      console.error('[SignupCompleteRoute] Signup error:', nextError);
      setError(nextError);
    }
  }, [completeOAuthSignup, profile, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void submit();
    }, 0);

    return () => clearTimeout(timer);
  }, [attempt, submit]);

  return (
    <SignupCompleteScreen
      errorMessage={error ? getSignupUserErrorMessage(error) : null}
      onEditNickname={() => router.replace('/signup/account?error=nickname')}
      onRetry={() => setAttempt((current) => current + 1)}
    />
  );
}

