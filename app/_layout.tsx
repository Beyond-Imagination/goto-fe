// Reactotron 디버거 및 런타임 Fallback 초기화 (반드시 최상단에 위치)
import '@/config/reactotron';

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileProvider } from '@/state/profile';
import { AuthProvider } from '@/auth';
import { PushProvider } from '@/push';

void SplashScreen.preventAutoHideAsync();

/** 프로필 설정 단계들은 같은 폼 안의 이동이라 짧은 페이드로 넘깁니다. */
const STEP_TRANSITION = { animation: 'fade', animationDuration: 100 } as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('../src/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../src/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../src/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../src/assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    // mock 모드(Expo Go)에는 네이티브 소셜 SDK가 없어서, 실제 로그인 모드에서만 lazy require로 초기화합니다.
    if (process.env.EXPO_PUBLIC_AUTH_MODE === 'mock') {
      return;
    }
    const { initializeSocialSDKs } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- 정적 import로 되돌리면 Expo Go(mock 모드)가 기동조차 못 합니다.
      require('../src/auth/social/socialLogin') as typeof import('../src/auth/social/socialLogin');
    initializeSocialSDKs();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    throw fontError;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileProvider>
            {/* 푸시 권한·토큰 등록과 알림 탭 이동은 세션이 필요해서 AuthProvider 안쪽에 둡니다. */}
            <PushProvider>
              {/* 스플래시만 밝은 아이콘을 쓰고, 나머지 흰 배경 화면은 어두운 아이콘으로 돌아옵니다. */}
              <StatusBar barStyle="dark-content" translucent />
              <Stack
                screenOptions={{
                  // 성격이 다른 화면으로 넘어가는 전환의 기본값.
                  animation: 'slide_from_right',
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" options={{ animation: 'fade' }} />
                <Stack.Screen name="login" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                <Stack.Screen name="help" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="permission" options={STEP_TRANSITION} />
                <Stack.Screen name="profile" options={STEP_TRANSITION} />
                <Stack.Screen name="design-system" />
              </Stack>
            </PushProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
