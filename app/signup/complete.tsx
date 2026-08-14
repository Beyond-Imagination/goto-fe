import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { AUTH_ERROR_CODE, AuthApiError, toOAuthSignupPreferences, useAuth } from '@/auth';
import { SignupCompleteScreen } from '@/screens/SignupCompleteScreen';
import { useProfile } from '@/state/profile';

export default function SignupCompleteRoute() {
  const router = useRouter();
  const { completeOAuthSignup } = useAuth();
  const { profile } = useProfile();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);

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

      setError(nextError instanceof Error ? nextError : new Error('회원가입을 완료하지 못했어요.'));
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
      errorMessage={error ? getErrorMessage(error) : null}
      onEditNickname={() => router.replace('/signup/account?error=nickname')}
      onRetry={() => setAttempt((current) => current + 1)}
    />
  );
}

function getErrorMessage(error: Error): string {
  if (error instanceof AuthApiError && error.errorCode === AUTH_ERROR_CODE.nicknameAlreadyInUse) {
    return '이미 사용 중인 닉네임입니다.';
  }

  return error.message || '회원가입을 완료하지 못했어요.';
}
