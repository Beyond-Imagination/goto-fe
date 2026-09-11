import type { DevicePlatform } from './deviceTokenApi';

/** OS 알림 권한 상태. expo-notifications의 결과를 좁힌 값입니다. */
export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type PushRegistrationInput = Readonly<{
  /** 로그인 세션이 있는지. 토큰은 회원에 묶이므로 로그인 전에는 등록하지 않습니다. */
  isLoggedIn: boolean;
  permission: PushPermission;
  /** FCM에서 받은 현재 토큰. 네이티브 모듈이 없거나 실패하면 null. */
  token: string | null;
  /** 서버에 등록해 둔 토큰(이 기기가 마지막으로 보낸 값). */
  registeredToken: string | null;
}>;

export type PushRegistrationAction =
  | { readonly kind: 'register'; readonly token: string }
  | { readonly kind: 'unregister'; readonly token: string }
  | { readonly kind: 'none' };

/**
 * 지금 서버에 무엇을 해야 하는지 정합니다.
 *
 * <p>규칙은 단순합니다. 로그인 상태에서 권한이 있고 토큰이 새로 생기거나 바뀌었으면 등록하고,
 * 로그아웃·권한 철회로 더 이상 받을 수 없게 되면 등록해 둔 토큰을 해제합니다.
 * 이미 같은 토큰을 등록했으면 아무 것도 하지 않습니다(앱 시작마다 중복 호출하지 않기 위함).
 */
export function decideRegistration(input: PushRegistrationInput): PushRegistrationAction {
  const canReceive = input.isLoggedIn && input.permission === 'granted' && input.token !== null;

  if (!canReceive) {
    return input.registeredToken !== null
      ? { kind: 'unregister', token: input.registeredToken }
      : { kind: 'none' };
  }

  // canReceive가 true면 token은 null이 아닙니다.
  const token = input.token as string;

  if (input.registeredToken === token) {
    return { kind: 'none' };
  }

  // 토큰이 바뀐 경우 옛 토큰 해제는 하지 않습니다 — FCM이 이미 무효로 만들었고,
  // 서버도 발송 실패 응답으로 정리합니다. 여기서 지우면 로그아웃과 구분이 어려워집니다.
  return { kind: 'register', token };
}

/** 앱이 도는 플랫폼. 웹에서는 이 기능을 쓰지 않습니다. */
export function toDevicePlatform(os: string): DevicePlatform | null {
  if (os === 'android') {
    return 'ANDROID';
  }
  if (os === 'ios') {
    return 'IOS';
  }
  return null;
}
