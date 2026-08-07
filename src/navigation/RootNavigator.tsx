import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { DesignSystemScreen } from '@/screens/DesignSystemScreen';
import { DisplayStepScreen } from '@/screens/DisplayStepScreen';
import { MobilityStepScreen } from '@/screens/MobilityStepScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PermissionScreen } from '@/screens/PermissionScreen';
import { PreferenceStepScreen } from '@/screens/PreferenceStepScreen';
import { ProfileDoneScreen } from '@/screens/ProfileDoneScreen';
import { SplashScreen } from '@/screens/SplashScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: { page?: string } | undefined;
  Permission: undefined;
  ProfileMobility: undefined;
  ProfilePreference: undefined;
  ProfileDisplay: undefined;
  ProfileDone: undefined;
  DesignSystem: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** 각 화면을 goto:// 딥링크로 바로 열 수 있게 합니다. QA와 스크린샷 캡처에도 씁니다. */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'goto://'],
  config: {
    screens: {
      Splash: 'splash',
      Onboarding: 'onboarding/:page?',
      Permission: 'permission',
      ProfileMobility: 'profile/mobility',
      ProfilePreference: 'profile/preference',
      ProfileDisplay: 'profile/display',
      ProfileDone: 'profile/done',
      DesignSystem: 'design-system',
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          // 기본값은 플랫폼(안드로이드는 짧은 페이드)에 맡겨져 뒤로가기가 뚝 끊겨 보입니다.
          // 앞뒤 모두 같은 슬라이드로 통일합니다.
          animation: 'slide_from_right',
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" options={{ animation: 'fade' }}>
          {({ navigation }) => <SplashScreen onDone={() => navigation.replace('Onboarding')} />}
        </Stack.Screen>

        <Stack.Screen name="Onboarding">
          {({ navigation, route }) => (
            <OnboardingScreen
              initialPage={Number(route.params?.page ?? 0) || 0}
              onStart={() => navigation.navigate('Permission')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Permission">
          {({ navigation }) => (
            <PermissionScreen
              onBack={() => navigation.goBack()}
              onConfirm={() => navigation.navigate('ProfileMobility')}
              onSkip={() => navigation.navigate('ProfileMobility')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfileMobility">
          {({ navigation }) => (
            <MobilityStepScreen
              onBack={() => navigation.goBack()}
              onNext={() => navigation.navigate('ProfilePreference')}
              onSkip={() => navigation.navigate('ProfileDone')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfilePreference">
          {({ navigation }) => (
            <PreferenceStepScreen
              onBack={() => navigation.goBack()}
              onNext={() => navigation.navigate('ProfileDisplay')}
              onSkip={() => navigation.navigate('ProfileDone')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfileDisplay">
          {({ navigation }) => (
            <DisplayStepScreen
              onBack={() => navigation.goBack()}
              onDone={() => navigation.navigate('ProfileDone')}
              onSkip={() => navigation.navigate('ProfileDone')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfileDone">
          {({ navigation }) => (
            <ProfileDoneScreen
              onRestart={() => navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] })}
            />
          )}
        </Stack.Screen>

        {/* develop에서 만든 디자인 시스템 쇼케이스. goto://design-system 으로만 진입합니다. */}
        <Stack.Screen component={DesignSystemScreen} name="DesignSystem" />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
