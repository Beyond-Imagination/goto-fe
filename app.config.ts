import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from '@expo/config-plugins';

const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '';
const naverUrlScheme = process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME?.trim() || 'goto-naver';
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

/**
 * FCM 설정 파일은 Firebase 콘솔에서 받아 저장소 밖(로컬)에 둡니다(.gitignore).
 * 파일이 없으면 Firebase 플러그인을 붙이지 않습니다 — 그래야 설정 파일 없이도 앱을 빌드·실행할 수 있고,
 * 푸시만 꺼진 상태가 됩니다(BE도 자격 증명이 없으면 같은 방식으로 비활성입니다).
 */
const androidGoogleServicesFile = resolve(__dirname, 'google-services.json');
const iosGoogleServicesFile = resolve(__dirname, 'GoogleService-Info.plist');
const hasAndroidFirebase = existsSync(androidGoogleServicesFile);
const hasIosFirebase = existsSync(iosGoogleServicesFile);
const hasFirebase = hasAndroidFirebase || hasIosFirebase;

/**
 * React Native Firebase는 기본으로 Swift Package Manager로 Firebase SDK를 가져오는데,
 * CocoaPods 정적 링크(이 프로젝트의 기본값)와 함께 쓰면 각 pod이 Firebase 복사본을 품어
 * 링크 단계에서 중복 심볼로 깨집니다. 이 전역 변수를 켜면 CocoaPods 경로로 돌아갑니다.
 *
 * Podfile은 prebuild가 생성하므로 파일을 직접 고치지 않고 여기서 한 줄을 얹습니다.
 */
const withRNFirebaseDisableSPM: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (nextConfig) => {
      const podfilePath = resolve(nextConfig.modRequest.platformProjectRoot, 'Podfile');
      const podfile = readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('$RNFirebaseDisableSPM')) {
        writeFileSync(podfilePath, `$RNFirebaseDisableSPM = true\n\n${podfile}`, 'utf8');
      }

      return nextConfig;
    },
  ]);

/**
 * expo-notifications와 react-native-firebase가 같은 meta-data
 * (기본 알림 아이콘·색)를 각자 선언해서 매니페스트 병합이 깨집니다.
 * 우리 값(브랜드 색)을 쓰겠다고 명시해 충돌을 끊습니다.
 */
const FIREBASE_NOTIFICATION_META = [
  'com.google.firebase.messaging.default_notification_color',
  'com.google.firebase.messaging.default_notification_icon',
];

const withFirebaseNotificationMetaOverride: ConfigPlugin = (config) =>
  withAndroidManifest(config, (nextConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(nextConfig.modResults);
    const manifest = nextConfig.modResults.manifest as unknown as { $: Record<string, string> };
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] ?? 'http://schemas.android.com/tools';

    for (const meta of application['meta-data'] ?? []) {
      if (FIREBASE_NOTIFICATION_META.includes(meta.$['android:name'])) {
        (meta.$ as Record<string, string>)['tools:replace'] = 'android:resource';
      }
    }

    return nextConfig;
  });

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
    ...(hasIosFirebase ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    // 푸시를 받으려면 remote-notification 백그라운드 모드와 APNs entitlement가 필요합니다.
    entitlements: {
      'aps-environment': 'development',
    },
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
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
    ...(hasAndroidFirebase ? { googleServicesFile: './google-services.json' } : {}),
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
    ...(hasFirebase
      ? [
          '@react-native-firebase/app',
          '@react-native-firebase/messaging',
          withRNFirebaseDisableSPM,
          withFirebaseNotificationMetaOverride,
        ]
      : []),
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          '내 주변 장소·장애물과 가까운 도움 요청을 찾는 데 위치를 사용합니다.',
        locationWhenInUsePermission:
          '내 주변 장소·장애물과 가까운 도움 요청을 찾는 데 위치를 사용합니다.',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-notifications',
      {
        // 안드로이드 알림 아이콘은 알파 채널만 쓰는 단색 실루엣이라, 풀컬러 앱 아이콘을 넣으면
        // 사각형 덩어리로 보입니다. 흰 로고 + 투명 배경 전용 아이콘을 따로 씁니다.
        icon: './assets/images/notification-icon.png',
        color: '#383CFF',
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
