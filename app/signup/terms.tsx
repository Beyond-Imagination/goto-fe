import { useRouter } from 'expo-router';

import { useAuth } from '@/auth';
import { SignupTermsScreen } from '@/screens/SignupTermsScreen';

export default function SignupTermsRoute() {
  const router = useRouter();
  const { cancelSignup, pendingSignup, saveSignupDetails } = useAuth();

  if (!pendingSignup) {
    return null;
  }

  return (
    <SignupTermsScreen
      initialAgreementMask={pendingSignup.details?.agreementMask}
      onBack={() => {
        cancelSignup();
        router.replace('/login');
      }}
      onContinue={(agreementMask) => {
        saveSignupDetails({
          agreementMask,
          nickname: pendingSignup.details?.nickname ?? pendingSignup.suggestedNickname ?? '',
        });
        router.push('/signup/account');
      }}
    />
  );
}
