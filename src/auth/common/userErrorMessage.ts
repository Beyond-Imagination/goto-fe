import { AUTH_ERROR_CODE } from './constants';
import {
  AuthApiError,
  OAuthProviderConfigurationError,
  OAuthProviderUnavailableError,
} from './errors';

type SocialProviderKey = 'kakao' | 'naver' | 'google' | 'apple' | string;

/**
 * 로그인 실패 시 사용자에게 전달할 한국어 오류 메시지를 반환합니다.
 * 기술적인 용어나 영문 SDK 에러 메시지를 노출하지 않고 사용자 시선의 안내 문구로 정규화합니다.
 */
export function getLoginUserErrorMessage(error: unknown, provider?: SocialProviderKey): string {
  if (error instanceof OAuthProviderUnavailableError) {
    const label = getProviderLabel(provider);
    return `${label} 로그인은 현재 준비 중이에요.`;
  }

  if (error instanceof OAuthProviderConfigurationError) {
    return '로그인 설정을 확인하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
  }

  if (error instanceof AuthApiError) {
    if (error.errorCode === AUTH_ERROR_CODE.invalidOAuthToken) {
      return '로그인 유효시간이 지났어요. 다시 로그인해주세요.';
    }

    if (error.message && containsKorean(error.message) && !isTechnicalMessage(error.message)) {
      return error.message;
    }

    return '서버와 연결하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
  }

  if (isNetworkError(error)) {
    return '인터넷 연결 상태가 불안정해요. 네트워크를 확인하고 다시 시도해주세요.';
  }

  const label = provider ? getProviderLabel(provider) : null;
  return label
    ? `${label} 로그인에 실패했어요. 다시 시도해주세요.`
    : '로그인을 완료하지 못했어요. 다시 시도해주세요.';
}

/**
 * 회원가입 완료 실패 시 사용자에게 전달할 한국어 오류 메시지를 반환합니다.
 */
export function getSignupUserErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.errorCode === AUTH_ERROR_CODE.nicknameAlreadyInUse) {
      return '이미 사용 중인 닉네임이에요. 다른 닉네임으로 변경해주세요.';
    }

    if (error.errorCode === AUTH_ERROR_CODE.signupAlreadyCompleted) {
      return '이미 가입이 완료된 계정이에요.';
    }

    if (error.errorCode === AUTH_ERROR_CODE.invalidOAuthToken) {
      return '로그인 유효시간이 지났어요. 처음부터 다시 로그인해주세요.';
    }

    if (error.message && containsKorean(error.message) && !isTechnicalMessage(error.message)) {
      return error.message;
    }

    return '회원가입 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
  }

  if (isNetworkError(error)) {
    return '인터넷 연결 상태가 불안정해요. 네트워크를 확인하고 다시 시도해주세요.';
  }

  return '회원가입을 완료하지 못했어요. 잠시 후 다시 시도해주세요.';
}

function getProviderLabel(provider?: string): string {
  switch (provider) {
    case 'kakao':
      return '카카오';
    case 'naver':
      return '네이버';
    case 'google':
      return '구글';
    case 'apple':
      return '애플';
    default:
      return '소셜';
  }
}

function isNetworkError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '';
  const name = error instanceof Error ? error.name : '';

  return (
    /network|fetch|timeout|econnrefused|socket|failed to fetch/i.test(message) ||
    /NetworkError|TypeError/i.test(name)
  );
}

function containsKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

function isTechnicalMessage(text: string): boolean {
  return /oauth|token|jwt|500|404|400|401|403|null|undefined|json|payload|exception|status|internal server error/i.test(
    text,
  );
}
