import { Redirect } from 'expo-router';
import { useState } from 'react';

import { SplashScreen } from '@/screens/SplashScreen';

export default function SplashRoute() {
  // TODO: 추후 여기는 서버 응답을 받아서 온보딩으로 이동할지 여부를 결정합시다!
  const [isComplete, setIsComplete] = useState(false);

  if (isComplete) {
    return <Redirect href="/login" />;
  }

  return <SplashScreen onDone={() => setIsComplete(true)} />;
}
