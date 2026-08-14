export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  // 네이버/카카오 등 서드파티 OAuth 콜백 URL은 네이티브 SDK가 토큰 발급용으로 소비하므로
  // Expo Router가 화면 경로로 인식하여 'Unmatched Route' 오류를 발생시키지 않도록 무시(null 반환)합니다.
  if (
    path.includes('thirdPartyLoginResult') ||
    path.includes('thirdPartyLoginReuslt') ||
    path.includes('goto-naver') ||
    path.includes('oauth') ||
    path.includes('kakaolink')
  ) {
    return null;
  }

  return path;
}
