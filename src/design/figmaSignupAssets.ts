import { Asset } from 'expo-asset';

function resolveAssetUri(asset: number): string {
  return Asset.fromModule(asset).uri;
}

/** 새 가입 화면에 사용하는 Figma 원본 벡터 에셋. */
export const FIGMA_SIGNUP_ASSETS = {
  arrowRight: resolveAssetUri(require('@/assets/signup/arrow-right.svg')),
  checkDisabledBackground: resolveAssetUri(require('@/assets/signup/check-disabled-background.svg')),
  checkSelectedBackground: resolveAssetUri(require('@/assets/signup/check-selected-background.svg')),
  defaultAvatarAdd: resolveAssetUri(require('@/assets/signup/default-avatar-add.svg')),
  defaultAvatarBackground: resolveAssetUri(require('@/assets/signup/default-avatar-background.svg')),
  defaultAvatarMark: resolveAssetUri(require('@/assets/signup/default-avatar-mark.svg')),
  icon01White: resolveAssetUri(require('@/assets/signup/icon-01-white.svg')),
  noticeMark: resolveAssetUri(require('@/assets/signup/notice-mark.svg')),
} as const;
