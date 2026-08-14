import { Alert, Platform } from 'react-native';

import { getProfilePhotoUnderDevelopmentAlertConfig } from './profilePhoto';

/**
 * 프로필 사진 기능이 준비되기 전까지 안내 팝업을 노출합니다.
 * iOS/Android 네이티브 Alert 및 Web window.alert를 지원합니다.
 */
export function showProfilePhotoUnderDevelopmentAlert(): void {
  const config = getProfilePhotoUnderDevelopmentAlertConfig();

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(config.message);
    }
    return;
  }

  Alert.alert(config.title, config.message, [{ text: config.buttonText }], {
    cancelable: config.cancelable,
  });
}
