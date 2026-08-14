import { Platform } from 'react-native';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoLogin } from '@react-native-kakao/user';

import { OAuthProviderUnavailableError } from '@/auth/common';
import type { SocialProvider } from '@/components/auth/socialProviders';

import { createKakaoLoginAdapter } from './kakaoLoginAdapter';
import { supportsKakaoNativeLogin } from './kakaoLoginPlatform';
import type { SocialLoginAdapter } from './socialLoginAdapter';

const kakaoLoginAdapter = createKakaoLoginAdapter(
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '',
  initializeKakaoSDK,
  kakaoLogin,
);

export function getSocialLoginAdapter(provider: SocialProvider): SocialLoginAdapter {
  if (provider !== 'kakao' || !supportsKakaoNativeLogin(Platform.OS)) {
    throw new OAuthProviderUnavailableError();
  }

  return kakaoLoginAdapter;
}
