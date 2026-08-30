import type { ExpoConfig } from 'expo/config';
import { AndroidConfig, type ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';

const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '';
const naverUrlScheme = process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME?.trim() || 'goto-naver';
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

const withLocalApiCleartextTraffic: ConfigPlugin = (config) => {
  if (!apiBaseUrl.startsWith('http://10.0.2.2:')) {
    return config;
  }

  return withAndroidManifest(config, (nextConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(nextConfig.modResults);
    application.$['android:usesCleartextTraffic'] = 'true';
    return nextConfig;
  });
};

const config: ExpoConfig = {
  name: '함께가길',
  owner: 'beyondimagination',
  slug: 'goto-fe',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'goto',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'net.beyondimagination.gotoapp',
    buildNumber: '1',
    supportsTablet: false,
    icon: './assets/images/icon.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: [
        'naversearchapp',
        'naversearchthirdlogin',
        'nidlogin',
        'kakaokompassauth',
        'kakaolink',
        'kakaoplus',
      ],
    },
  },
  android: {
    package: 'net.beyondimagination.gotoapp',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon-foreground.png',
      backgroundImage: './assets/images/adaptive-icon-background.png',
      backgroundColor: '#383CFF',
    },
  },
  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    withLocalApiCleartextTraffic,
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#383CFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [
            'https://devrepo.kakao.com/nexus/content/groups/public/',
            'https://repository.map.naver.com/archive/maven',
          ],
        },
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.NAVER_MAP_CLIENT_ID,
      },
    ],
    // 환경변수가 없는 설정 확인 실행을 위해 조건부 적용
    ...(kakaoNativeAppKey
      ? [
          [
            '@react-native-kakao/core',
            {
              nativeAppKey: kakaoNativeAppKey,
              android: {
                authCodeHandlerActivity: true,
              },
              ios: {
                handleKakaoOpenUrl: true,
              },
            },
          ],
        ]
      : []),
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: naverUrlScheme,
      },
    ],
    ...(googleIosUrlScheme
      ? [
          [
            '@react-native-google-signin/google-signin',
            {
              iosUrlScheme: googleIosUrlScheme,
            },
          ],
        ]
      : []),
    'expo-secure-store',
    'expo-router',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'd8b9484a-b5c8-49e0-b12d-261a5cda885b',
    },
  },
};

export default config;
