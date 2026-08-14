import type { AuthStatus, PendingOAuthSignup, PlatformSession } from '@/auth/common';
import type { AccessibilityProfile } from '@/state/profile';

export interface DevUserPersona {
  id: string;
  name: string;
  description: string;
  auth: {
    status: AuthStatus;
    session: PlatformSession | null;
    pendingSignup: PendingOAuthSignup | null;
  };
  profile: AccessibilityProfile;
}

export const DEV_PERSONAS = {
  // 1. 기본 신규 가입자 (가입 대기 중, 약관 동의 및 프로필 설정 화면 테스트용)
  NEW_SIGNUP_USER: {
    id: 'new_signup_user',
    name: '신규 가입자 (개발테스터)',
    description: '카카오 로그인 완료 후 약관 동의 및 프로필 설정 단계',
    auth: {
      status: 'unauthenticated' as AuthStatus,
      session: null,
      pendingSignup: {
        provider: 'KAKAO' as const,
        providerAccessToken: 'dev-mock-provider-token',
        suggestedNickname: '개발테스터',
        details: {
          agreementMask: 15,
          nickname: '개발테스터',
        },
      },
    },
    profile: {
      mobility: [],
      facilities: [],
      avoid: [],
      largeText: false,
      highContrast: false,
      vibration: false,
      statusAlerts: false,
    },
  },

  // 2. 휠체어 사용자 (로그인 완료, 휠체어+엘리베이터+계단회피 설정 완료)
  WHEELCHAIR_USER: {
    id: 'wheelchair_user',
    name: '휠체어 사용자 (김이동)',
    description: '로그인 완료, 휠체어 모드, 엘리베이터/경사로 선호, 계단 회피',
    auth: {
      status: 'authenticated' as AuthStatus,
      session: {
        accessToken: 'mock-wheelchair-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        expiresAt: Date.now() + 86400000,
      },
      pendingSignup: null,
    },
    profile: {
      mobility: ['wheelchair' as const],
      facilities: ['엘리베이터', '경사로', '장애인 화장실'],
      avoid: ['계단', '급경사', '높은 턱'],
      largeText: false,
      highContrast: true,
      vibration: true,
      statusAlerts: true,
    },
  },

  // 3. 유모차 동반 사용자 (로그인 완료, 유모차 모드)
  STROLLER_USER: {
    id: 'stroller_user',
    name: '유모차 동반자 (이든든)',
    description: '로그인 완료, 유모차 모드, 수유실/엘리베이터 선호, 계단/좁은통로 회피',
    auth: {
      status: 'authenticated' as AuthStatus,
      session: {
        accessToken: 'mock-stroller-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        expiresAt: Date.now() + 86400000,
      },
      pendingSignup: null,
    },
    profile: {
      mobility: ['stroller' as const],
      facilities: ['엘리베이터', '수유실', '경사로'],
      avoid: ['계단', '좁은통로', '보도 파손'],
      largeText: false,
      highContrast: false,
      vibration: false,
      statusAlerts: true,
    },
  },
} as const;

export const DEFAULT_DEV_PERSONA = DEV_PERSONAS.NEW_SIGNUP_USER;
