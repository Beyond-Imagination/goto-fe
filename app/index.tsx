import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/auth';
import { getInitialRoute } from '@/navigation/initialRoute';
import { SplashScreen } from '@/screens/SplashScreen';

export default function SplashRoute() {
  const { session, status } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const onSplashDone = useCallback(() => setSplashComplete(true), []);

  const route = getInitialRoute(status, Boolean(session), splashComplete);

  if (route === null) {
    return <SplashScreen onDone={onSplashDone} />;
  }

  return <Redirect href={route} />;
}
