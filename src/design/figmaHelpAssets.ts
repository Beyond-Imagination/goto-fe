import { Asset } from 'expo-asset';

function resolveAssetUri(asset: number): string {
  return Asset.fromModule(asset).uri;
}

/** 도움 요청 홈에 사용하는 Figma 원본 벡터 에셋. */
export const FIGMA_HELP_ASSETS = {
  arrowDark: resolveAssetUri(require('@/assets/help/arrow-dark.svg')),
  arrowWhite: resolveAssetUri(require('@/assets/help/arrow-white.svg')),
  back: resolveAssetUri(require('@/assets/help/back.svg')),
  call: resolveAssetUri(require('@/assets/help/call.svg')),
  helperPerson: resolveAssetUri(require('@/assets/help/helper-person.svg')),
  nearbyPeople: resolveAssetUri(require('@/assets/help/nearby-people.svg')),
  nearbyPeopleFade: resolveAssetUri(require('@/assets/help/nearby-people-fade.svg')),
  warning: resolveAssetUri(require('@/assets/help/warning.svg')),
} as const;
