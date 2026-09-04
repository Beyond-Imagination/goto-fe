import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoLogin } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';

import { OAuthProviderUnavailableError } from '@/auth/common';
import type { SocialProvider } from '@/components/auth/socialProviders';
import { logger } from '@/utils/logger';

import { createGoogleLoginAdapter } from './googleLoginAdapter';
import { supportsGoogleNativeLogin } from './googleLoginPlatform';
import { createKakaoLoginAdapter } from './kakaoLoginAdapter';
import { supportsKakaoNativeLogin } from './kakaoLoginPlatform';
import { createNaverLoginAdapter } from './naverLoginAdapter';
import { supportsNaverNativeLogin } from './naverLoginPlatform';
import type { SocialLoginAdapter } from './socialLoginAdapter';

const kakaoLoginAdapter = createKakaoLoginAdapter(
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '',
  initializeKakaoSDK,
  kakaoLogin,
);

const naverLoginAdapter = createNaverLoginAdapter(
  {
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY?.trim() ?? '',
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET?.trim() ?? '',
    appName: process.env.EXPO_PUBLIC_NAVER_APP_NAME?.trim() || '함께가길',
    serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME?.trim() || 'goto-naver',
  },
  (config) => NaverLogin.initialize(config),
  () => NaverLogin.login(),
);

const googleLoginAdapter = createGoogleLoginAdapter(
  {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim(),
    scopes: ['profile', 'email'],
  },
  (config) => GoogleSignin.configure(config),
  (options) => GoogleSignin.hasPlayServices(options),
  () => GoogleSignin.signIn(),
  () => GoogleSignin.getTokens(),
);

export function initializeSocialSDKs(): void {
  try {
    const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();
    if (kakaoKey && supportsKakaoNativeLogin(Platform.OS)) {
      initializeKakaoSDK(kakaoKey);
    }
  } catch (error) {
    logger.warn('[Kakao OAuth] Early initialization failed:', error);
  }

  try {
    const naverConsumerKey = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY?.trim();
    const naverConsumerSecret = process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET?.trim();
    if (naverConsumerKey && naverConsumerSecret && supportsNaverNativeLogin(Platform.OS)) {
      NaverLogin.initialize({
        consumerKey: naverConsumerKey,
        consumerSecret: naverConsumerSecret,
        appName: process.env.EXPO_PUBLIC_NAVER_APP_NAME?.trim() || '함께가길',
        serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_SERVICE_URL_SCHEME?.trim() || 'goto-naver',
      });
    }
  } catch (error) {
    logger.warn('[Naver OAuth] Early initialization failed:', error);
  }

  try {
    const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
    const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
    if ((googleWebClientId || googleIosClientId) && supportsGoogleNativeLogin(Platform.OS)) {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        iosClientId: googleIosClientId,
        scopes: ['profile', 'email'],
      });
    }
  } catch (error) {
    logger.warn('[Google OAuth] Early initialization failed:', error);
  }
}

export function getSocialLoginAdapter(provider: SocialProvider): SocialLoginAdapter {
  if (provider === 'kakao') {
    if (!supportsKakaoNativeLogin(Platform.OS)) {
      throw new OAuthProviderUnavailableError();
    }
    return kakaoLoginAdapter;
  }

  if (provider === 'naver') {
    if (!supportsNaverNativeLogin(Platform.OS)) {
      throw new OAuthProviderUnavailableError();
    }
    return naverLoginAdapter;
  }

  if (provider === 'google') {
    if (!supportsGoogleNativeLogin(Platform.OS)) {
      throw new OAuthProviderUnavailableError();
    }
    return googleLoginAdapter;
  }

  throw new OAuthProviderUnavailableError();
}
