/** 구글 네이티브 SDK로 로그인할 수 있는 앱 플랫폼인지 확인한다. */
export function supportsGoogleNativeLogin(platform: string): boolean {
  return platform === 'android' || platform === 'ios';
}
