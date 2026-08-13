import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '@/auth';
import { SignupAccountScreen } from '@/screens/SignupAccountScreen';

export default function SignupAccountRoute() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { cancelSignup, pendingSignup, saveSignupDetails } = useAuth();

  if (!pendingSignup) {
    return null;
  }

  return (
    <SignupAccountScreen
      errorMessage={error === 'nickname' ? '이미 사용 중인 닉네임입니다.' : null}
      initialAgreementMask={pendingSignup.details?.agreementMask}
      initialNickname={pendingSignup.details?.nickname ?? pendingSignup.suggestedNickname ?? ''}
      onBack={() => {
        cancelSignup();
        router.replace('/login');
      }}
      onContinue={(details) => {
        saveSignupDetails(details);
        router.push('/permission');
      }}
    />
  );
}
