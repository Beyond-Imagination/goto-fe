import type { ReportPhoto } from './reportModel';

/** BE ImageStorageProperties.allowedContentTypes와 맞춘 값입니다. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export type PickPhotosResult =
  | { readonly ok: true; readonly photos: readonly ReportPhoto[] }
  | {
      readonly ok: false;
      readonly reason: 'permissionDenied' | 'canceled' | 'unsupportedType' | 'unavailable';
    };

/**
 * expo-image-picker는 네이티브 모듈이라 최상단에서 import하면
 * 이 모듈이 빠진 개발 빌드에서 앱 로드 자체가 죽습니다 (Expo Go 포함).
 * 사진을 실제로 고를 때만 불러오고, 없으면 화면에서 안내로 처리합니다.
 */
function loadImagePicker(): typeof import('expo-image-picker') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker') as typeof import('expo-image-picker');
  } catch {
    return null;
  }
}

/**
 * 사진 보관함에서 이미지를 고릅니다.
 * 권한 거부·취소·미지원 형식을 구분해 돌려주므로 화면에서 안내 문구를 나눠 쓸 수 있습니다.
 */
export async function pickReportPhotos(remainingSlots: number): Promise<PickPhotosResult> {
  const ImagePicker = loadImagePicker();

  if (ImagePicker === null) {
    return { ok: false, reason: 'unavailable' };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { ok: false, reason: 'permissionDenied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: remainingSlots > 1,
    mediaTypes: ['images'],
    selectionLimit: remainingSlots,
  });

  if (result.canceled) {
    return { ok: false, reason: 'canceled' };
  }

  const photos = result.assets
    .map(asset => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? undefined,
    }))
    .filter(photo => ALLOWED_MIME_TYPES.includes(photo.mimeType));

  if (photos.length === 0) {
    return { ok: false, reason: 'unsupportedType' };
  }

  return { ok: true, photos };
}
