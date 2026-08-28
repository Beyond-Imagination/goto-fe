/**
 * 환경 변수에 설정된 API 기본 URL을 반환합니다.
 * 끝에 붙은 슬래시(/)는 자동으로 제거됩니다.
 */
export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  return apiBaseUrl.replace(/\/+$/, '');
}
