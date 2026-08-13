import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth';

export default function SignupLayout() {
  const { pendingSignup } = useAuth();

  if (!pendingSignup) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
