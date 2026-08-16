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
  name: 'Goto',
  slug: 'goto-fe',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'goto',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'net.beyondimagination.gotoapp',
    supportsTablet: true,
    icon: './assets/images/icon.png',
    infoPlist: {
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
          extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
        },
      },
    ],
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
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: naverUrlScheme,
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme || undefined,
      },
    ],
    'expo-secure-store',
    'expo-router',
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
