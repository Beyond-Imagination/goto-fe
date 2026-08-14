import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '@/auth';
import { SignupAccountScreen } from '@/screens/SignupAccountScreen';

export default function SignupAccountRoute() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { isNicknameAvailable, pendingSignup, saveSignupDetails } = useAuth();

  if (!pendingSignup) {
    return null;
  }

  const agreementMask = pendingSignup.details?.agreementMask;

  if (agreementMask == null) {
    return <Redirect href="/signup/terms" />;
  }

  return (
    <SignupAccountScreen
      initialNicknameUnavailable={error === 'nickname'}
      initialNickname={pendingSignup.details?.nickname ?? pendingSignup.suggestedNickname ?? ''}
      onBack={() => {
        router.replace('/signup/terms');
      }}
      onCheckNickname={isNicknameAvailable}
      onContinue={(nickname) => {
        saveSignupDetails({ agreementMask, nickname });
        router.push('/permission');
      }}
    />
  );
}
