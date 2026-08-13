/**
 * 세션 상태 전이.
 *
 * restoring        → unauthenticated | authenticated | restore_failed
 * restore_failed   → restoring(재시도) | unauthenticated(로그인 화면)
 * unauthenticated  → signing_in | restoring
 * signing_in       → authenticated | signup_required | unauthenticated
 * signup_required  → signing_up | unauthenticated(취소)
 * signing_up       → authenticated | signup_required | unauthenticated
 * authenticated    → unauthenticated(세션 삭제)
 */
export const AUTH_STATUS = {
  /** 앱 시작 또는 재시도. refresh token으로 세션을 확인 중이며 스플래시를 유지한다. */
  restoring: 'restoring',
  /** 로그인 필요. 세션과 pendingSignup이 없다. */
  unauthenticated: 'unauthenticated',
  /** 플랫폼 세션이 있어 앱을 쓸 수 있다. access token은 메모리에만 둔다. */
  authenticated: 'authenticated',
  /** refresh는 실패했지만 토큰은 남아 있다. 재시도하거나 로그인 화면으로 보낸다. */
  restore_failed: 'restore_failed',
  /** 카카오 SDK와 oauth/login 진행 중. */
  signing_in: 'signing_in',
  /** 신규 회원. pendingSignup이 있고 가입 플로우로 간다. */
  signup_required: 'signup_required',
  /** oauth/signup 요청 중. */
  signing_up: 'signing_up',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export const OAUTH_LOGIN_STATUS = {
  /** 기존 회원. 플랫폼 토큰을 발급한다. */
  authenticated: 'AUTHENTICATED',
  /** 신규 회원. 가입 플로우가 필요하다. */
  signupRequired: 'SIGN_UP_REQUIRED',
} as const;

export type OAuthLoginStatus = (typeof OAUTH_LOGIN_STATUS)[keyof typeof OAUTH_LOGIN_STATUS];

export const AUTH_ERROR_CODE = {
  /** 카카오 토큰 만료. pendingSignup을 지우고 다시 로그인한다. */
  invalidOAuthToken: 'INVALID_OAUTH_TOKEN',
  /** 가입이 이미 끝난 계정. signup 대신 login으로 세션을 복구한다. */
  signupAlreadyCompleted: 'OAUTH_SIGNUP_ALREADY_COMPLETED',
  /** 닉네임 중복. 가입 대기를 유지하고 입력을 고친다. */
  nicknameAlreadyInUse: 'NICKNAME_ALREADY_IN_USE',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];
