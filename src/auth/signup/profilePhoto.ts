export const PROFILE_PHOTO_UNDER_DEVELOPMENT_MESSAGE = '현재 개발 중인 기능입니다.';
export const PROFILE_PHOTO_ALERT_TITLE = '안내';

export interface ProfilePhotoAlertConfig {
  readonly title: string;
  readonly message: string;
  readonly buttonText: string;
  readonly cancelable: boolean;
}

export function getProfilePhotoUnderDevelopmentAlertConfig(): ProfilePhotoAlertConfig {
  return {
    title: PROFILE_PHOTO_ALERT_TITLE,
    message: PROFILE_PHOTO_UNDER_DEVELOPMENT_MESSAGE,
    buttonText: '확인',
    cancelable: true,
  };
}

export interface ProfilePhotoResult {
  readonly uri: string;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly type?: string;
}

export type ProfilePhotoPickerHandler = () => Promise<ProfilePhotoResult | null> | void;
