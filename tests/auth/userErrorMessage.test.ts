import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_ERROR_CODE,
  AuthApiError,
  OAuthProviderConfigurationError,
  OAuthProviderUnavailableError,
  getLoginUserErrorMessage,
  getSignupUserErrorMessage,
} from '@/auth/common';


test('미지원 로그인 방식(OAuthProviderUnavailableError)은 프로바이더별 준비 중 한국어 메시지를 반환한다', () => {
  assert.equal(
    getLoginUserErrorMessage(new OAuthProviderUnavailableError(), 'kakao'),
    '카카오 로그인은 현재 준비 중이에요.',
  );
  assert.equal(
    getLoginUserErrorMessage(new OAuthProviderUnavailableError(), 'naver'),
    '네이버 로그인은 현재 준비 중이에요.',
  );
  assert.equal(
    getLoginUserErrorMessage(new OAuthProviderUnavailableError(), 'google'),
    '구글 로그인은 현재 준비 중이에요.',
  );
  assert.equal(
    getLoginUserErrorMessage(new OAuthProviderUnavailableError(), 'web'),
    '소셜 로그인은 현재 준비 중이에요.',
  );
});

test('설정 오류(OAuthProviderConfigurationError)는 기술적 키 정보를 숨기고 사용자 친화적 문구를 반환한다', () => {
  const error = new OAuthProviderConfigurationError(
    '카카오 Native App Key가 설정되지 않았습니다. EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY를 확인해주세요.',
  );
  assert.equal(
    getLoginUserErrorMessage(error, 'kakao'),
    '로그인 설정을 확인하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  );
});

test('카카오/네이버 SDK의 영문 에러는 프로바이더별 한국어 안내 메시지로 정규화된다', () => {
  const kakaoSdkError = new Error('KakaoSDKError: [E_AUTH_FAIL] native module failure');
  assert.equal(
    getLoginUserErrorMessage(kakaoSdkError, 'kakao'),
    '카카오 로그인에 실패했어요. 다시 시도해주세요.',
  );

  const naverSdkError = new Error('User failed to login via Naver OAuth SDK');
  assert.equal(
    getLoginUserErrorMessage(naverSdkError, 'naver'),
    '네이버 로그인에 실패했어요. 다시 시도해주세요.',
  );

  const unknownError = { code: 'UNKNOWN_SDK_EXCEPTION', message: 'Internal error' };
  assert.equal(
    getLoginUserErrorMessage(unknownError, 'kakao'),
    '카카오 로그인에 실패했어요. 다시 시도해주세요.',
  );
});

test('네트워크 오류는 네트워크 상태 확인 안내 메시지를 반환한다', () => {
  const networkError = new TypeError('Failed to fetch');
  assert.equal(
    getLoginUserErrorMessage(networkError, 'kakao'),
    '인터넷 연결 상태가 불안정해요. 네트워크를 확인하고 다시 시도해주세요.',
  );
  assert.equal(
    getSignupUserErrorMessage(networkError),
    '인터넷 연결 상태가 불안정해요. 네트워크를 확인하고 다시 시도해주세요.',
  );

  const socketError = new Error('Network request failed: timeout');
  assert.equal(
    getLoginUserErrorMessage(socketError, 'naver'),
    '인터넷 연결 상태가 불안정해요. 네트워크를 확인하고 다시 시도해주세요.',
  );
});

test('서버 API 에러(AuthApiError)는 코드별/상황별 한국어 안내를 반환한다', () => {
  const tokenExpiredError = new AuthApiError(
    401,
    AUTH_ERROR_CODE.invalidOAuthToken,
    'Invalid or expired OAuth token',
  );
  assert.equal(
    getLoginUserErrorMessage(tokenExpiredError, 'kakao'),
    '로그인 유효시간이 지났어요. 다시 로그인해주세요.',
  );
  assert.equal(
    getSignupUserErrorMessage(tokenExpiredError),
    '로그인 유효시간이 지났어요. 처음부터 다시 로그인해주세요.',
  );

  const nicknameInUseError = new AuthApiError(
    409,
    AUTH_ERROR_CODE.nicknameAlreadyInUse,
    '이미 사용 중인 닉네임입니다.',
  );
  assert.equal(
    getSignupUserErrorMessage(nicknameInUseError),
    '이미 사용 중인 닉네임이에요. 다른 닉네임으로 변경해주세요.',
  );

  const signupCompletedError = new AuthApiError(
    409,
    AUTH_ERROR_CODE.signupAlreadyCompleted,
    'Signup already completed',
  );
  assert.equal(
    getSignupUserErrorMessage(signupCompletedError),
    '이미 가입이 완료된 계정이에요.',
  );

  const technicalServerError = new AuthApiError(
    500,
    undefined,
    '500 Internal Server Error (JSON parse failed)',
  );
  assert.equal(
    getLoginUserErrorMessage(technicalServerError, 'kakao'),
    '서버와 연결하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  );
  assert.equal(
    getSignupUserErrorMessage(technicalServerError),
    '회원가입 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  );
});

test('기타 알 수 없는 예외 발생 시 안전한 기본 한국어 메시지를 반환한다', () => {
  assert.equal(
    getLoginUserErrorMessage(null, 'kakao'),
    '카카오 로그인에 실패했어요. 다시 시도해주세요.',
  );
  assert.equal(
    getLoginUserErrorMessage(undefined),
    '로그인을 완료하지 못했어요. 다시 시도해주세요.',
  );
  assert.equal(
    getSignupUserErrorMessage('unknown string error'),
    '회원가입을 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
  );
});
