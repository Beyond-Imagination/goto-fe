import { Asset } from "expo-asset";

function resolveAssetUri(asset: number): string {
  return Asset.fromModule(asset).uri;
}

export const FIGMA_NAVIGATION_ASSETS = {
  background: resolveAssetUri(require('@/assets/navigation/background.svg')),
  homeSquare: resolveAssetUri(require('@/assets/navigation/home-square.svg')),
  homeSquareStroke: resolveAssetUri(require('@/assets/navigation/home-square-stroke.svg')),
  location: resolveAssetUri(require('@/assets/navigation/location.svg')),
  locationAction: resolveAssetUri(require('@/assets/navigation/location-action.svg')),
  profileBody: resolveAssetUri(require('@/assets/navigation/profile-body.svg')),
  profileBodyFilled: resolveAssetUri(require('@/assets/navigation/profile-body-filled.svg')),
  profileHead: resolveAssetUri(require('@/assets/navigation/profile-head.svg')),
  profileHeadFilled: resolveAssetUri(require('@/assets/navigation/profile-head-filled.svg')),
  reportDocument: resolveAssetUri(require('@/assets/navigation/report-document.svg')),
  reportDocumentFilled: resolveAssetUri(require('@/assets/navigation/report-document-active.svg')),
  reportPencil: resolveAssetUri(require('@/assets/navigation/report-pencil.svg')),
  reportPencilFilled: resolveAssetUri(require('@/assets/navigation/report-pencil-filled.svg')),
  saved: resolveAssetUri(require('@/assets/navigation/saved.svg')),
  savedFilled: resolveAssetUri(require('@/assets/navigation/saved-filled.svg'))
} as const;
