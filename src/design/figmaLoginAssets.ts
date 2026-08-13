import { Asset } from 'expo-asset';

function resolveAssetUri(asset: number): string {
  return Asset.fromModule(asset).uri;
}

export const FIGMA_LOGIN_ASSETS = {
  googleBlue: resolveAssetUri(require('@/assets/auth/google-vector-1.svg')),
  googleGreen: resolveAssetUri(require('@/assets/auth/google-vector-2.svg')),
  googleRed: resolveAssetUri(require('@/assets/auth/google-vector-4.svg')),
  googleYellow: resolveAssetUri(require('@/assets/auth/google-vector-3.svg')),
  kakao: resolveAssetUri(require('@/assets/auth/kakao.svg')),
  naver: resolveAssetUri(require('@/assets/auth/naver.svg')),
} as const;
